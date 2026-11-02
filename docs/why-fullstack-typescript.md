# Why fullstack TypeScript?

If you build for the web, you're already writing TypeScript in the browser. So here's a question worth
asking: what if your backend spoke the same language?

You'd get something that's hard to appreciate until you've worked with it: **change the database or
the API, and your editor immediately shows you everything that change affects, all the way to the React
component on the other end.** There's no client to regenerate and no contract to keep in sync by hand.
The backend and frontend stop being two projects that have to be kept in agreement, and become one
project that the compiler checks as a whole.

This repo is a small but complete example of that setup. This document explains what makes it so nice
to work with, and the [experiments in the README](../README.md#seeing-the-types-at-work) let you see it
for yourself in a few minutes.

## One change, followed across the stack

Rename a field in the API contract, in
[`packages/schemas/src/health.ts`](../packages/schemas/src/health.ts). Without running anything, two
things turn red:

- the API handler that returns the field
- the React component that reads it

One edit, and the compiler hands you a to-do list that spans the whole stack. It works from the database
too: rename a property in
[`packages/db/src/schema/todos.ts`](../packages/db/src/schema/todos.ts), and every query and handler
that uses it gets flagged.

The UI gets this by importing the API's types directly, in
[`apps/ui/src/lib/api-client.ts`](../apps/ui/src/lib/api-client.ts):

```ts
import type { AppType } from "@ts-todo/api/app";

export const api = hc<AppType>(env.VITE_API_URL, {
	init: { credentials: "include" },
});
```

That's the whole setup. `api.todos.$get()` now knows the route exists and what it returns, with
autocomplete. Nothing is generated, and because it's `import type`, no server code reaches the browser.

### Compared with a different backend language

Python, C#, Go and Rust are all great languages, and you can get a typed client with any of them. The
usual way is to have the backend publish an OpenAPI description, then generate TypeScript from it. Here's
what that means for the same change:

| Step                                | TypeScript backend | Another backend |
| ----------------------------------- | ------------------ | --------------- |
| Change the backend                  | Yes                | Yes             |
| Export the OpenAPI description      | Not needed         | Yes             |
| Regenerate the client               | Not needed         | Yes             |
| Keep generated code in sync         | Not needed         | Yes             |
| See what the change broke in the UI | Immediately        | After the above |

Teams automate those steps, but then the automation is one more thing to maintain, and until it runs, the
frontend's types describe the old API. With TypeScript on both sides, that gap doesn't exist.

## One language, one way of working

The compiler is only part of it. Using one language changes how the work feels day to day:

- **You can follow a feature end to end.** One person can add the table, the route and the screen in one
  sitting, without changing mental gears, and all of it can go in one pull request.
- **Go to definition crosses the stack.** Packages export their TypeScript source, so jumping to `Todo`
  from the UI lands in [`packages/schemas/src/todo.ts`](../packages/schemas/src/todo.ts), the code you'd
  actually change.
- **Everyone can read everything.** A frontend developer can read a handler, and a backend developer can
  read a query hook.
- **There's one set of tools to learn.** The API, shared packages and UI share a test runner, a linter and
  a formatter, and a single `pnpm test` runs all their unit tests.
- **Code can move freely.** Logic that starts in a handler can move to a shared package and run in the
  browser too, without being rewritten.

## One schema, many jobs

This is the benefit that's hardest to get any other way. The contract lives in
[`packages/schemas`](../packages/schemas/src), written with [Zod](https://zod.dev). It's ordinary
TypeScript, so the very same code runs in the browser and on the server.

From one definition of `Todo`, you get:

- the types the API and UI compile against
- the API docs at `/scalar`
- the API's response check, in [`check-response.ts`](../apps/api/src/lib/check-response.ts)
- the browser's response check, in
  [`parse-response-with.ts`](../apps/ui/src/lib/parse-response-with.ts)

Validation is shared too. The
[new-todo form](../apps/ui/src/routes/_authenticated/-components/new-todo-form.tsx) and the API both use
`PostTodoInput`, so a too-long title gets the same message, from the same rule, in both places. Change the
limit once, and both follow. With a separate backend language, that rule usually gets written twice, or
passes through another generated layer.

## Safety at runtime too

TypeScript's types are checked when you compile, then erased, so on their own they can't tell you what
actually came over the network. Zod closes that gap using the schemas you already have, so adding runtime
checks here took very little code:

```ts
queryFn: () => parseResponseWith(Todo.array(), api.todos.$get()),
```

Pair a schema with the wrong route and it won't even compile. This repo checks responses at both ends, and
each check has its own job:

| Check                                                            | What it does                                                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`checkResponse`](../apps/api/src/lib/check-response.ts)         | Runs on every route defined with `.openapi`. A bad response fails in development and tests, naming the route and field |
| [`parseResponseWith`](../apps/ui/src/lib/parse-response-with.ts) | Runs in the browser. If a live API and UI ever disagree, the user sees a clear error, not a broken page                |

You can watch the first one work in the
[last experiment in the README](../README.md#seeing-the-types-at-work): the code passes the type check,
and the tests still catch it.

One detail is worth copying: `Todo` has no length limits, while `PostTodoInput` does. A limit says what may
be written _from now on_, but stored data can be older than the rule. Keeping them separate means you can
tighten a rule without making existing todos invalid.

## What pnpm workspaces add

A monorepo keeps related code in one repository. A _workspace_ is what makes its packages work together,
and pnpm's is excellent. Everything below is set up in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) and
the `package.json` files.

- **Packages import each other by name, with no publish step.** `"@ts-todo/schemas": "workspace:*"` always
  means the copy in this repo. Each package's `exports` points at its `.ts` source, so there's no build to
  wait for either.
- **One commit can change everything.** The contract, the API and the UI change together, and get reviewed
  and tested together.
- **One version of each shared dependency.** The `catalog` lists a version once, and packages refer to it
  with `"catalog:"`. Tools that must move together, like `vitest` and `@vitest/browser-playwright`, can't
  drift apart.
- **Strict dependencies.** A package can only import what its own `package.json` declares, so the UI can't
  accidentally use `pg`.
- **Commands that target what you want.** `pnpm --filter @ts-todo/schemas test` runs one package, and
  `pnpm --recursive` runs them all.
- **Safer installs.** Versions are exact, a new release must be a day old before it can be installed
  (`minimumReleaseAge`), and only listed packages may run install scripts (`allowBuilds`).
- **The same tools for everyone.** `devEngines` in the root `package.json` pins the Node and pnpm versions.

## The tooling

The tools share a goal: catch problems as early and as cheaply as possible.

| Tool                                                       | Why it's here                                                                                                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [oxlint](https://oxc.rs/docs/guide/usage/linter) and oxfmt | Fast linting and formatting. [`oxlint.config.ts`](../oxlint.config.ts) also enforces the architecture: browser code can't import the database layer, and can only import the API as a type |
| [Vitest](https://vitest.dev)                               | One test runner for every package. UI tests run in a real browser                                                                                                                          |
| [Playwright](https://playwright.dev)                       | Tests the whole stack, in a browser, against a real API and database                                                                                                                       |
| [Lefthook](https://lefthook.dev)                           | Git hooks: format and lint on commit, type-check and test on push                                                                                                                          |
| [GitHub Actions](../.github/workflows/ci.yml)              | Runs everything again on every pull request                                                                                                                                                |
| [tsx](https://github.com/privatenumber/tsx)                | Runs the API's TypeScript directly in development, restarting on changes                                                                                                                   |

## The libraries

What makes this stack feel like one project is that the types flow from each library into the next.

- **[Drizzle](https://orm.drizzle.team)** (database) defines tables in TypeScript, so row types come
  straight from the schema, and migrations are generated from it.
- **[Zod](https://zod.dev)** (validation) runs in both the browser and the server, and infers TypeScript
  types from each schema, so you don't write them twice.
- **[Hono](https://hono.dev)** (API framework) has a client, `hc`, that takes the API's type directly. That's
  what makes the setup above possible.
- **[`@hono/zod-openapi`](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)** turns one
  route definition into request validation, handler types and API docs.
- **[Better Auth](https://www.better-auth.com)** (authentication) runs inside the API and stores its data
  through Drizzle, and `c.get("user")` is fully typed in protected handlers.
- **[TanStack Router](https://tanstack.com/router)** (routing) type-checks links and URL parameters, so a
  link to a page that doesn't exist won't compile.
- **[TanStack Query](https://tanstack.com/query)** (server data) handles caching, loading and error states,
  and keeps the types the API client provides.
- **[TanStack Form](https://tanstack.com/form)** (forms) validates with the same Zod schemas as the API.
- **[Radix Themes](https://www.radix-ui.com/themes)** (components) provides accessible components with very
  little styling work.

## Deployment

One toolchain pays off here too. The API, UI and shared packages use the same language, lockfile and CI
setup, and CI checks both sides of a contract change together. `pnpm --filter` can build just one package,
and `pnpm deploy` can produce a trimmed copy of a package with only its own dependencies. Bad configuration
is caught early as well: [`apps/api/src/env.ts`](../apps/api/src/env.ts) refuses to start in production
without its auth settings.

This repo stops short of deploying anything, so here's what to know if you take it further. This is general
guidance rather than something tried here:

- **Give the API a build step.** Packages export raw `.ts`, so you'd typically bundle the API and its
  packages together.
- **Set `NODE_ENV=production`.** `env.ts` falls back to `development` when it's unset, which leaves the API
  docs on and makes `checkResponse` fail requests instead of logging them.
- **Release API changes before the UI that needs them.** One commit can change both sides, but people can
  still have an old UI open after a release, so keep API changes backward compatible.
- **Run `pnpm tc` in CI**, as this repo does, because `vite build` doesn't check types.
- **Build the UI once per environment.** Vite fixes `VITE_API_URL` at build time.

## When to reach for something else

No stack suits everything. If your backend's core job is heavy computation, Go, Rust or C# will serve you
better, and Python's ecosystem is hard to beat for machine learning. If the API mainly serves non-TypeScript
clients, like a native mobile app, they won't get the shared types, though they can still use the OpenAPI
description. You can also add a service in another language later, just for the part that needs it.

Most web backends, though, validate input, talk to a database and return JSON, and that's exactly where this
setup shines.

## Give it a try

The best argument for this setup is using it:

1. [Get the project running](../README.md#running-it).
2. Try the [experiments in the README](../README.md#seeing-the-types-at-work), and watch the errors appear.
3. Follow [Adding a feature](../README.md#adding-a-feature) to add something of your own, from the table to
   the screen.

Notice how little of your attention goes to keeping the two sides in agreement. That's the point.
