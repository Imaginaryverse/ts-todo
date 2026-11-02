import { ApiError } from "@ts-todo/schemas";
import { DetailedError } from "hono/client";

/** The message to show for a failed request: the API's own words when it sent any. */
export function getErrorMessage(error: unknown) {
	if (error instanceof DetailedError) {
		const body = ApiError.safeParse(error.detail?.data);
		if (body.success) {
			return body.data.error.issues?.[0]?.message ?? body.data.error.message;
		}
	}

	return error instanceof Error ? error.message : "Unknown error";
}

/** The API responded successfully, but not with what its schema promises. */
export class InvalidResponseError extends Error {
	constructor() {
		super("The server sent an unexpected response. Try reloading the page.");
		this.name = "InvalidResponseError";
	}
}
