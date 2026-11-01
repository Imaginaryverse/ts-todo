import { createRoute } from "@hono/zod-openapi";
import { GetHealthResponse } from "@ts-todo/schemas";

import { jsonResponseBody, jsonResponseError } from "../../lib/openapi";

const tags = ["health"];

export const getHealthRoute = createRoute({
	method: "get",
	path: "/",
	tags,
	responses: {
		200: jsonResponseBody(GetHealthResponse, "The server is running correctly"),
		...jsonResponseError("SERVICE_UNAVAILABLE", "The server can't reach the database"),
	},
});

export type GetHealthRoute = typeof getHealthRoute;
