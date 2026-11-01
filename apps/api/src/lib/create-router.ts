import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../types";
import { AppError, toApiErrorIssues } from "./errors";

export function createRouter() {
	return new OpenAPIHono<AppEnv>({
		defaultHook: (result) => {
			if (!result.success) {
				throw new AppError("BAD_REQUEST", "Invalid request", toApiErrorIssues(result.error));
			}
		},
	});
}
