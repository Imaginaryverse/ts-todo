import { z } from "zod";

export const ErrorReason = z.enum([
	"BAD_REQUEST",
	"UNAUTHORIZED",
	"FORBIDDEN",
	"NOT_FOUND",
	"CONFLICT",
	"UNPROCESSABLE_CONTENT",
	"INTERNAL_SERVER_ERROR",
	"SERVICE_UNAVAILABLE",
]);
export type ErrorReason = z.infer<typeof ErrorReason>;

export const ApiErrorIssue = z.object({
	path: z.array(z.union([z.string(), z.number()])),
	message: z.string(),
});
export type ApiErrorIssue = z.infer<typeof ApiErrorIssue>;

export const ApiError = z.object({
	error: z.object({
		reason: ErrorReason,
		message: z.string().min(1),
		issues: z.array(ApiErrorIssue).optional(),
	}),
});
export type ApiError = z.infer<typeof ApiError>;
