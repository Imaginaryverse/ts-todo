import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import type { Schema } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

import { version } from "../../package.json";
import { env } from "../env";
import { errorHandler } from "../http/error-handler";
import { notFoundHandler } from "../http/not-found-handler";
import type { AppEnv } from "../types";
import { createRouter } from "./create-router";

type AppOpenAPI<S extends Schema = Schema, P extends string = "/"> = OpenAPIHono<AppEnv, S, P>;

function configureOpenAPI(app: AppOpenAPI) {
	// Visiting the server in a browser lands on the API docs.
	app.get("/", (c) => c.redirect("/scalar"));

	app.doc("/doc", {
		openapi: "3.1.0",
		info: { title: "TS Todo API", version },
	});

	app.get(
		"/scalar",
		Scalar({
			url: "/doc",
			theme: "purple",
			defaultHttpClient: {
				targetKey: "js",
				clientKey: "fetch",
			},
		}),
	);
}

export function createApp() {
	const app = createRouter();

	if (env.NODE_ENV !== "test") {
		app.use(logger());
	}

	app.use(requestId());
	app.use(
		"*",
		cors({
			origin: env.APP_ORIGIN,
			credentials: true,
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		}),
	);

	if (env.NODE_ENV === "development") {
		configureOpenAPI(app);
	}

	app.onError(errorHandler);
	app.notFound(notFoundHandler);

	return app;
}
