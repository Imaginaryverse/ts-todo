# TS Todo

TS Todo is a small todo app for learning fullstack development with TypeScript.
It uses Postgres for the database, Hono for the API, and React for the frontend,
all in one pnpm monorepo.

## Prerequisites

This project uses Node 24 (see `.nvmrc`). The easiest way to get it is fnm:

```sh
# macOS / Linux
brew install fnm    # or: curl -fsSL https://fnm.vercel.app/install | bash

# Windows
winget install Schniz.fnm
```

Then add this to your shell config (`~/.zshrc` or `~/.bashrc`):

```sh
eval "$(fnm env --use-on-cd --version-file-strategy=recursive)"
```

On Windows, add this to your PowerShell profile instead (open it with `notepad $PROFILE`):

```powershell
fnm env --use-on-cd --version-file-strategy=recursive | Out-String | Invoke-Expression
```

Open a new terminal, `cd` into the project, and run `fnm install` once.

Then install pnpm and the project's dependencies:

```sh
npm install --global pnpm
pnpm install
```

You'll also need [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or another Docker runtime) to run the database.

## Running it

```sh
cp .env.example .env              # the defaults work for local development
pnpm services:up                  # start Postgres in Docker
pnpm db:migrate                   # create the tables
pnpm db:seed                      # add demo users and todos
pnpm dev                          # start the API on http://localhost:3000 and the UI on http://localhost:5173
```

Open <http://localhost:5173> and sign in with one of the demo accounts below. In development, the
buttons in the corners open the Router and React Query Devtools, where you can inspect every route
and query. You can also check the API with `curl http://localhost:3000/health`, or browse its docs at
<http://localhost:3000/scalar>.

The seed creates two demo users with their own todos: `alice@example.com` and `bob@example.com`,
both with the password `demo-password`. Run `pnpm db:seed` again at any time to restore them; it
leaves any other accounts alone, and it refuses to run against a database that isn't local.

Other useful commands, all run from the repo root:

| Command            | What it does                                                          |
| ------------------ | --------------------------------------------------------------------- |
| `pnpm test`        | Run every test (starts Postgres if it isn't running)                  |
| `pnpm test:e2e`    | Run the Playwright tests against the real API and a separate database |
| `pnpm tc`          | Type-check every package                                              |
| `pnpm lint`        | Lint with oxlint                                                      |
| `pnpm fmt:fix`     | Format with oxfmt                                                     |
| `pnpm db:generate` | Create a migration after changing the Drizzle schema                  |
| `pnpm db:seed`     | Reset the demo users and their todos                                  |
| `pnpm db:studio`   | Browse the database in Drizzle Studio                                 |

`pnpm test` and `pnpm test:e2e` both run tests in a real browser, so install Chromium once with
`pnpm --filter @ts-todo/e2e exec playwright install chromium`.

## Project structure

The repo is a pnpm workspace: `apps/` holds things you run, and `packages/` holds code they share.
Packages import each other by name (`@ts-todo/schemas`) like any npm package, but straight from
source, so a change in one is picked up everywhere without a build step.

```text
apps/
  api/          Hono API: routes, handlers, and the OpenAPI docs
  ui/           React frontend: calls the API through a typed client
  e2e/          Playwright tests of the whole stack
packages/
  db/           Drizzle schema, migrations, and the database client
  schemas/      Zod schemas shared by the API and the frontend (the API contract)
```

In `apps/api/src/`, pieces the whole app shares sit at the top level:

| Path          | Contents                                                             |
| ------------- | -------------------------------------------------------------------- |
| `app.ts`      | Mounts every module's router; the starting point for reading the API |
| `server.ts`   | Starts the HTTP server and shuts it down cleanly                     |
| `auth.ts`     | Better Auth setup                                                    |
| `db.ts`       | The database client                                                  |
| `env.ts`      | Validates environment variables at startup                           |
| `types.ts`    | Types for Hono's environment and for route handlers                  |
| `lib/`        | Creating the app and routers, error handling, and OpenAPI helpers    |
| `middleware/` | Middleware that routes opt in to, like `requireAuth`                 |
| `seed/`       | The demo data behind `pnpm db:seed`, and the script that loads it    |
| `modules/`    | One folder per API feature                                           |

Auth isn't in `modules/` because Better Auth defines its own routes; a module is a set of routes you
write yourself. Each API feature lives in `apps/api/src/modules/<feature>/`:

| File                    | Contents                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `<feature>.routes.ts`   | Route definitions: path, method, request and response schemas                                                      |
| `<feature>.handlers.ts` | What each route does, plus a `to<Name>Dto` function when it returns stored data, to fit the shared response schema |
| `<feature>.service.ts`  | Database access and other logic that doesn't know about HTTP, if the feature needs any (`users` doesn't)           |
| `<feature>.index.ts`    | The module's entry point: the router that connects routes to handlers, and the only file `app.ts` imports          |

Handlers that return stored data build responses field by field with a `to<Name>Dto` function
instead of passing database rows straight through. Hono doesn't check responses against the schema at runtime, so this is what keeps
internal columns like `userId` out of responses and turns `Date`s into the ISO strings the shared
schemas expect.

In `apps/ui/src/`:

| Path               | Contents                                                                          |
| ------------------ | --------------------------------------------------------------------------------- |
| `main.tsx`         | Starts React and provides the query client to the app                             |
| `router.ts`        | Creates the router and the query client, and handles expired sessions             |
| `routes/`          | One file or folder per screen; `-components/` holds components unique to a screen |
| `components/`      | UI used by more than one route, or by the app shell                               |
| `routeTree.gen.ts` | Generated from `routes/` by the router plugin; don't edit it                      |
| `env.ts`           | Validates environment variables when the app loads                                |
| `lib/`             | The typed API client and the auth client                                          |
| `queries/`         | TanStack Query hooks, one file per API feature                                    |

Imports point in one direction: `routes` → `components` → `queries` → `lib`. A component that needs
users and todos imports from both `queries/` files, with nothing to work around.

The UI gets its API types from `import type { AppType } from "@ts-todo/api/app"` in
`lib/api-client.ts`. There's no code generation, and because it's a type-only import, no server code
ends up in the browser bundle.

Tests sit next to the code they test (`health.test.ts`). `apps/api/test/` only holds test helpers
and setup. The setup runs API tests against a separate `ts_todo_test` database that's created and
migrated automatically.

To test a single package, use `pnpm --filter @ts-todo/schemas test`. Unlike `pnpm test` at the root,
a package's own script doesn't start Postgres, so run `pnpm services:up` before testing
`@ts-todo/api`.

## Seeing the types at work

Packages share types straight from source, so a change in one package is a type error in the code
that depends on it, with no build step in between. Four changes to try (undo each one afterwards):

- **Rename a database column's property.** In `packages/db/src/schema/todos.ts`, change
  `description: text("description")` to `details: text("description")`, then run `pnpm tc`.
  `apps/api` now fails in `toTodoDto` and in the insert and update in `todos.service.ts`. The insert's
  error is misleading: it names `userId`, because TypeScript reports the last overload it tried, but
  the renamed property is the real cause.
- **Change the API contract.** In `packages/schemas/src/todo.ts`, add `priority: z.number(),` to
  `Todo`, then run `pnpm tc`. `toTodoDto` in `apps/api` no longer returns a valid `Todo`, and neither
  does the test data in `packages/schemas`.
- **Change a contract the UI uses.** In `packages/schemas/src/health.ts`, rename `status` to `state`,
  then run `pnpm tc`. The API's health handler no longer matches the contract, and `data.status` in
  `apps/ui/src/components/health-status.tsx` no longer exists, so one change flags both sides before
  you run anything.
- **Tighten a validation rule.** In `packages/schemas/src/todo.ts`, change `TodoTitle`'s `.max(100)`
  to `.max(10)`. There's no type error this time, because it's a runtime rule. Instead, the new-todo
  form and the API now both reject an 11-character title, with the same message.

## Adding a feature

The `todos` feature is a complete example of each step:

1. **Table:** add `packages/db/src/schema/<feature>.ts`, using the shared columns in `columns.ts`,
   and export it from `schema/index.ts`. Run `pnpm db:generate`, then `pnpm db:migrate`.
2. **Contract:** add the Zod schemas in `packages/schemas/src/<feature>.ts` and export them from
   `index.ts`.
3. **Module:** add `apps/api/src/modules/<feature>/`, with the files described in
   [Project structure](#project-structure).
4. **Mount:** add the router to the `.route(...)` chain in `apps/api/src/app.ts`.
5. **Tests:** add `<feature>.test.ts` next to the module, using the helpers in
   `apps/api/test/helpers.ts`.
6. **Demo data:** if people should see the feature right after setup, add it to
   `apps/api/src/seed/seed.ts`.
7. **UI:** add query options and hooks in `apps/ui/src/queries/<feature>.ts`, then add screens under
   `apps/ui/src/routes/`. Forms can validate with the same Zod schemas as the API, as
   `routes/_authenticated/-components/new-todo-form.tsx` does. Put components unique to one screen in
   a `-components/` folder next to it.
8. **UI tests:** cover the main flows in `apps/e2e/tests/`, and any component with real logic in a
   `<name>.test.tsx` next to it.

## Auth

Sign-up, sign-in and sessions are handled by [Better Auth](https://www.better-auth.com/), which
owns every route under `/auth` (for example `POST /auth/sign-up/email` and
`POST /auth/sign-in/email`). In development, the API docs at <http://localhost:3000/scalar> have an
"Auth" source where you can try them; signing up there also signs you in for `GET /users/me`.

Things to know:

- **Protected routes** add `middleware: requireAuth` to their `createRoute` config. Their handlers
  can then read the signed-in user with `c.get("user")`, fully typed.
- **Errors from `/auth/*` use Better Auth's format** (`{ code, message }`), not the `ApiError`
  shape the rest of the API uses. Better Auth's client handles its own format.
- **The UI reads the session through React Query** (`queries/session.ts`), not Better Auth's own
  `useSession` store. Routes under `routes/_authenticated/` require a session.
- **Users are always created through Better Auth**, never with raw database inserts: passwords are
  hashed and stored on `accounts` in Better Auth's format. Tests use the helpers in
  `apps/api/test/helpers.ts`.
