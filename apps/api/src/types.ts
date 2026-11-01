import type { HttpBindings } from "@hono/node-server";
import type { RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { Context, Env } from "hono";

/** The Hono environment every route and middleware shares. */
export interface AppEnv extends Env {
	Bindings: HttpBindings;
	Variables: {
		requestId: string;
	};
}

export type AppContext = Context<AppEnv>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>;
