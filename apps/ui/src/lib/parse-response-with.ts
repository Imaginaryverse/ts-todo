import { type ClientResponse, parseResponse } from "hono/client";
import type { z } from "zod";

import { InvalidResponseError } from "./api-error";

type SuccessBody<R extends ClientResponse<any>> = Awaited<ReturnType<typeof parseResponse<R>>>;

/**
 * Hono's `parseResponse`, plus a runtime check against `schema`. Types disappear at runtime, so this
 * is what catches a deployed UI and API that no longer agree. The schema's type has to match the
 * route's, so pairing a schema with the wrong route doesn't compile.
 */
export async function parseResponseWith<R extends ClientResponse<any>>(
	schema: z.ZodType<SuccessBody<R>>,
	request: Promise<R>,
): Promise<SuccessBody<R>> {
	const body = await parseResponse(request);
	const result = schema.safeParse(body);
	if (!result.success) {
		console.error("The API's response doesn't match its schema", result.error.issues);
		throw new InvalidResponseError();
	}
	return result.data;
}
