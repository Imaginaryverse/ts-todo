import type { HttpBindings } from "@hono/node-server";
import type { RouteConfig, RouteConfigToEnv, RouteHandler } from "@hono/zod-openapi";
import type { Context, Env } from "hono";

import type { AuthSession, AuthUser } from "./auth";

interface Variables {
	requestId: string;
}

/** The Hono environment every route and middleware shares. */
export interface AppEnv extends Env {
	Bindings: HttpBindings;
	Variables: Variables;
}

/** The environment of routes behind `requireAuth`: the signed-in user and session are available. */
export interface AppEnvAuth extends AppEnv {
	Variables: Variables & {
		user: AuthUser;
		session: AuthSession;
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
