import { OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../types";
import { checkResponse } from "./check-response";
import { AppError, toApiErrorIssues } from "./errors";

export function createRouter() {
	const router = new OpenAPIHono<AppEnv>({
		defaultHook: (result) => {
			if (!result.success) {
				throw new AppError("BAD_REQUEST", "Invalid request", toApiErrorIssues(result.error));
			}
		},
	});

	// Every route gets the response check first, so it also sees errors from later middleware
	const openapi = router.openapi.bind(router);
	router.openapi = ((route, handler, hook) =>
		openapi(
			{ ...route, middleware: [checkResponse(route), ...[route.middleware ?? []].flat()] },
			handler,
			hook,
		)) as typeof router.openapi;

	return router;
}
