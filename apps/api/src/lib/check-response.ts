import type { RouteConfig } from "@hono/zod-openapi";
import { createMiddleware } from "hono/factory";
import { z } from "zod";

import { env } from "../env";
import type { AppEnv } from "../types";
import { AppError, toApiErrorIssues } from "./errors";

/**
 * Checks each response against the schema its route declares, since Hono doesn't. A mismatch fails
 * the request in development and tests, and is only logged in production: the response has already
 * been built, and the UI's own check decides what a user sees.
 */
export function checkResponse(route: RouteConfig) {
	return createMiddleware<AppEnv>(async (c, next) => {
		await next();

		const response = route.responses[c.res.status];
		const media =
			response && "content" in response ? response.content?.["application/json"] : undefined;
		const schema = media && "schema" in media ? media.schema : undefined;
		if (!(schema instanceof z.ZodType)) {
			return;
		}

		// A body that isn't JSON counts as a mismatch, rather than failing the request in production
		const body: unknown = await c.res
			.clone()
			.json()
			.catch(() => undefined);
		const result = schema.safeParse(body);
		if (result.success) {
			return;
		}

		const issues = toApiErrorIssues(result.error);
		const message = `Response doesn't match the ${c.res.status} schema of ${route.method.toUpperCase()} ${route.path}`;
		if (env.NODE_ENV === "production") {
			console.error({ requestId: c.get("requestId"), message, issues });
			return;
		}
		throw new AppError("INTERNAL_SERVER_ERROR", message, issues);
	});
}
