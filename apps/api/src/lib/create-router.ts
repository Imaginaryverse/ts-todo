import { OpenAPIHono } from "@hono/zod-openapi";

import { AppError, toApiErrorIssues } from "../http/errors";
import type { AppEnv } from "../types";

export function createRouter() {
	return new OpenAPIHono<AppEnv>({
		defaultHook: (result) => {
			if (!result.success) {
				throw new AppError("BAD_REQUEST", "Invalid request", toApiErrorIssues(result.error));
			}
		},
	});
}
