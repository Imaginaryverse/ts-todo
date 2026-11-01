import type { HttpBindings } from "@hono/node-server";
import type { RouteConfig, RouteConfigToEnv, RouteHandler } from "@hono/zod-openapi";
import type { Context, Env } from "hono";

/** The Hono environment every route and middleware shares. */
export interface AppEnv extends Env {
	Bindings: HttpBindings;
	Variables: {
		requestId: string;
	};
}

export type AppContext = Context<AppEnv>;

/**
 * A handler for an OpenAPI route. Its environment comes from the route's `middleware`, so a route
 * with `requireAuth` gets a handler where `c.get("user")` is typed.
 */
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
	R,
	RouteConfigToEnv<R> extends AppEnv ? RouteConfigToEnv<R> : AppEnv
>;
