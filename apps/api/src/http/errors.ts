import type { ApiError, ApiErrorIssue, ErrorReason } from "@ts-todo/schemas";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { z } from "zod";

import type { AppContext } from "../types";

export const STATUS_BY_REASON = {
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE_CONTENT: 422,
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503,
} as const satisfies Record<ErrorReason, ContentfulStatusCode>;

/**
 * Throw from services and other code that doesn't know which route it's serving; `errorHandler`
 * turns it into a response. In handlers, prefer returning `sendError` for errors the route declares.
 */
export class AppError extends Error {
	readonly reason: ErrorReason;
	readonly status: ContentfulStatusCode;
	readonly issues: ApiErrorIssue[] | undefined;

	constructor(reason: ErrorReason, message: string, issues?: ApiErrorIssue[]) {
		super(message);
		this.name = "AppError";
		this.reason = reason;
		this.status = STATUS_BY_REASON[reason];
		this.issues = issues;
	}

	toBody(): ApiError {
		return { error: { reason: this.reason, message: this.message, issues: this.issues } };
	}
}

export function toApiErrorIssues(error: z.ZodError): ApiErrorIssue[] {
	return error.issues.map((issue) => ({
		path: issue.path.map((key) => (typeof key === "symbol" ? String(key) : key)),
		message: issue.message,
	}));
}

/**
 * Return from a handler for an error the route declares in its `responses`, so the status and body
 * are checked against the OpenAPI spec. Elsewhere, throw an `AppError` instead.
 */
export function sendError<R extends ErrorReason>(
	c: AppContext,
	error: ApiError["error"] & { reason: R },
) {
	return c.json({ error } satisfies ApiError, STATUS_BY_REASON[error.reason]);
}
