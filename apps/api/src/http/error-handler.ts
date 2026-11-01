import type { ApiError } from "@ts-todo/schemas";
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import type { AppContext, AppEnv } from "../types";
import { AppError } from "./errors";

function logError(err: Error, c: AppContext) {
	console.error({
		requestId: c.get("requestId"),
		method: c.req.method,
		url: c.req.url,
		error: err,
	});
}

function handleAppError(err: AppError, c: AppContext) {
	if (err.status >= 500) {
		logError(err, c);
	}
	return c.json(err.toBody(), err.status);
}

function handleHonoError(err: HTTPException, c: AppContext) {
	if (err.status >= 500) {
		logError(err, c);
	}
	const errorDetails: ApiError = {
		error: {
			reason: err.status < 500 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
			message: err.message || "Request failed",
		},
	};
	return c.json(errorDetails, err.status);
}

function handleUnexpectedError(err: Error, c: AppContext) {
	logError(err, c);

	const errorDetails: ApiError = {
		error: {
			reason: "INTERNAL_SERVER_ERROR",
			message: "An unexpected error occurred",
		},
	};
	return c.json(errorDetails, 500);
}

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
	if (err instanceof AppError) {
		return handleAppError(err, c);
	}

	// Thrown by Hono's own middleware, e.g. a malformed JSON body or a body over the size limit.
	if (err instanceof HTTPException) {
		return handleHonoError(err, c);
	}

	return handleUnexpectedError(err, c);
};
