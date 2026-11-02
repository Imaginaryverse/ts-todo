import { DetailedError } from "hono/client";
import { expect, test } from "vitest";

import { getErrorMessage } from "./api-error";

function apiFailure(data: unknown) {
	return new DetailedError("422 Unprocessable Entity", { statusCode: 422, detail: { data } });
}

test("uses the API's message", () => {
	const error = apiFailure({ error: { reason: "CONFLICT", message: "Title is taken" } });

	expect(getErrorMessage(error)).toBe("Title is taken");
});

test("prefers the first issue, which says what's wrong with the input", () => {
	const error = apiFailure({
		error: {
			reason: "BAD_REQUEST",
			message: "Invalid request",
			issues: [{ path: ["title"], message: "Enter a title" }],
		},
	});

	expect(getErrorMessage(error)).toBe("Enter a title");
});

test("falls back to the status when the body isn't in the API's format", () => {
	expect(getErrorMessage(apiFailure("<html>Bad gateway</html>"))).toBe("422 Unprocessable Entity");
});

test("uses the message of any other error", () => {
	expect(getErrorMessage(new TypeError("Failed to fetch"))).toBe("Failed to fetch");
});
