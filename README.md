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
pnpm dev                          # start the API on http://localhost:3000
```

Check that it's up with `curl http://localhost:3000/health`, or browse the API docs at
<http://localhost:3000/scalar>.

Other useful commands, all run from the repo root:

| Command            | What it does                                         |
| ------------------ | ---------------------------------------------------- |
| `pnpm test`        | Run every test (starts Postgres if it isn't running) |
| `pnpm tc`          | Type-check every package                             |
| `pnpm lint`        | Lint with oxlint                                     |
| `pnpm fmt:fix`     | Format with oxfmt                                    |
| `pnpm db:generate` | Create a migration after changing the Drizzle schema |
| `pnpm db:studio`   | Browse the database in Drizzle Studio                |

## Project structure

The repo is a pnpm workspace: `apps/` holds things you run, and `packages/` holds code they share.
Packages import each other by name (`@ts-todo/schemas`) like any npm package, but straight from
source, so a change in one is picked up everywhere without a build step.

```text
apps/
  api/          Hono API: routes, handlers, and the OpenAPI docs
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
| `modules/`    | One folder per API feature                                           |

Auth isn't in `modules/` because Better Auth defines its own routes; a module is a set of routes you
write yourself. Each API feature lives in `apps/api/src/modules/<feature>/`:

| File                    | Contents                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `<feature>.routes.ts`   | Route definitions: path, method, request and response schemas                                                |
| `<feature>.handlers.ts` | What each route does, plus a `to<Name>Dto` function that turns database rows into the shared response schema |
| `<feature>.service.ts`  | Database access and other logic that doesn't know about HTTP, if the feature needs any (`users` doesn't)     |
| `<feature>.index.ts`    | The module's entry point: the router that connects routes to handlers, and the only file `app.ts` imports    |

Handlers build responses field by field with their `to<Name>Dto` function instead of returning
database rows. Hono doesn't check responses against the schema at runtime, so this is what keeps
internal columns like `userId` out of responses and turns `Date`s into the ISO strings the shared
schemas expect.

Tests sit next to the code they test (`health.test.ts`). `apps/api/test/` only holds the test
setup, which runs API tests against a separate `ts_todo_test` database that's created and migrated
automatically.

To test a single package, use `pnpm --filter @ts-todo/schemas test`. Unlike `pnpm test` at the root,
a package's own script doesn't start Postgres, so run `pnpm services:up` before testing
`@ts-todo/api`.

## Seeing the types at work

Packages share types straight from source, so a change in one package is a type error in the code
that depends on it, with no build step in between. Two changes to try (undo each one afterwards):

- **Rename a database column's property.** In `packages/db/src/schema/todos.ts`, change
  `description: text("description")` to `details: text("description")`, then run `pnpm tc`.
  `apps/api` now fails in both `toTodoDto` and the queries in `todos.service.ts`.
- **Change the API contract.** In `packages/schemas/src/todo.ts`, add `priority: z.number(),` to
  `Todo`, then run `pnpm tc`. `toTodoDto` in `apps/api` no longer returns a valid `Todo`, and neither
  does the test data in `packages/schemas`.

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
- **Users are always created through Better Auth**, never with raw database inserts: passwords are
  hashed and stored on `accounts` in Better Auth's format. Tests use the helpers in
  `apps/api/test/helpers.ts`.
