import { createRoute } from "@hono/zod-openapi";
import { User } from "@ts-todo/schemas";

import { jsonResponseBody, jsonResponseError } from "../../lib/openapi";
import { requireAuth } from "../../middleware/require-auth";

const tags = ["users"];

export const getMeRoute = createRoute({
	method: "get",
	path: "/me",
	tags,
	middleware: requireAuth,
	responses: {
		200: jsonResponseBody(User, "The signed-in user"),
		...jsonResponseError("UNAUTHORIZED", "No valid session"),
	},
});

export type GetMeRoute = typeof getMeRoute;
