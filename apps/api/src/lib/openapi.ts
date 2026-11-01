import type { RouteConfig } from "@hono/zod-openapi";
import { ApiError, type ErrorReason } from "@ts-todo/schemas";
import { z, type ZodType } from "zod";

import { STATUS_BY_REASON } from "../http/errors";

type ZodRequestBody = NonNullable<NonNullable<RouteConfig["request"]>["body"]>;
type ZodResponseBody = RouteConfig["responses"][number];

/**
 * Define the request body shape.
 * @param schema The request body schema
 * @param description A description of the request body
 * @param opts Request body options (e.g., `required: true`)
 * @returns A request body definition
 */
export function jsonRequestBody<T extends ZodType>(
	schema: T,
	description: string,
	opts?: { required?: boolean },
) {
	return {
		content: {
			"application/json": {
				schema,
			},
		},
		description,
		required: opts?.required,
	} satisfies ZodRequestBody;
}

/**
 * Define the response body shape.
 * @param schema The response body schema
 * @param description A description of the response body
 * @returns A response body definition
 */
export function jsonResponseBody<T extends ZodType>(schema: T, description: string) {
	return {
		content: {
			"application/json": {
				schema,
			},
		},
		description,
	} satisfies ZodResponseBody;
}

function errorSchema<R extends ErrorReason>(reason: R) {
	return ApiError.extend({
		error: ApiError.shape.error.extend({ reason: z.literal(reason) }),
	});
}

/**
 * Define an error response, keyed by the status that matches its reason. Spread it into `responses`
 * (`...jsonResponseError("NOT_FOUND", "…")`) so the status and reason can't disagree.
 * @param reason The error reason this response sends, so the docs and handler types show only it
 * @param description A description of the error
 * @returns An object with a single response definition, keyed by status code
 */
export function jsonResponseError<R extends ErrorReason>(reason: R, description: string) {
	const response = jsonResponseBody(errorSchema(reason), description);
	return { [STATUS_BY_REASON[reason]]: response } as {
		[S in (typeof STATUS_BY_REASON)[R]]: typeof response;
	};
}

/**
 * Define a response with no body (e.g. 204 No Content).
 * @param description A description of the response
 * @returns A response definition with no content
 */
export function noContentResponse(description: string) {
	return { description } satisfies ZodResponseBody;
}
