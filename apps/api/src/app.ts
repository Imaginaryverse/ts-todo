import { createApp } from "./lib/create-app";
import { healthRouter } from "./modules/health/health.index";
import { usersRouter } from "./modules/users/users.index";

// Routes are chained so `AppType` carries their types for the RPC client.
const app = createApp().route("/health", healthRouter).route("/users", usersRouter);

export default app;

/**
 * The API's routes as a type, for Hono's RPC client in the frontend. Always import it with
 * `import type { AppType } from "@ts-todo/api/app"`: a regular import would bundle the server
 * (including `env.ts`, which exits the process) into the browser build.
 */
export type AppType = typeof app;
