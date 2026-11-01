import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "./create-app";
import { AppError } from "./errors";

const app = createApp();

app.get("/app-error", () => {
	throw new AppError("CONFLICT", "Email is already taken");
});
app.get("/server-app-error", () => {
	throw new AppError("INTERNAL_SERVER_ERROR", "Something broke on purpose");
});
app.get("/hono-error", () => {
	throw new HTTPException(413, { message: "Payload too large" });
});
app.get("/unexpected-error", () => {
	throw new Error("Connection string leaked: postgres://secret");
});
app.openapi(
	createRoute({
		method: "post",
		path: "/todos",
		request: {
			body: {
				content: { "application/json": { schema: z.object({ title: z.string().min(1) }) } },
			},
		},
		responses: { 200: { description: "Created" } },
	}),
	(c) => c.json(c.req.valid("json"), 200),
);

function postJson(path: string, body: string) {
	return app.request(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body,
	});
}

describe("errorHandler", () => {
	it("responds with an AppError's status and body", async () => {
		const res = await app.request("/app-error");

		expect(res.status).toBe(409);
		expect(await res.json()).toEqual({
			error: { reason: "CONFLICT", message: "Email is already taken" },
		});
	});

	it("logs AppErrors with a 5xx status", async () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await app.request("/server-app-error");

		expect(res.status).toBe(500);
		expect(consoleError).toHaveBeenCalledOnce();
	});

	it("keeps the status of errors thrown by Hono", async () => {
		const res = await app.request("/hono-error");

		expect(res.status).toBe(413);
		expect(await res.json()).toEqual({
			error: { reason: "BAD_REQUEST", message: "Payload too large" },
		});
	});

	it("hides the details of unexpected errors from the client but logs them", async () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await app.request("/unexpected-error");

		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({
			error: { reason: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
		});
		expect(consoleError).toHaveBeenCalledOnce();
	});

	it("rejects a body that isn't valid JSON", async () => {
		const res = await postJson("/todos", "{not json");

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			error: { reason: "BAD_REQUEST", message: "Malformed JSON in request body" },
		});
	});
});

describe("request validation", () => {
	it("lists each invalid field in issues", async () => {
		const res = await postJson("/todos", JSON.stringify({ title: "" }));

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			error: {
				reason: "BAD_REQUEST",
				message: "Invalid request",
				issues: [{ path: ["title"], message: expect.any(String) }],
			},
		});
	});
});

describe("notFoundHandler", () => {
	it("responds with a NOT_FOUND ApiError for unknown routes", async () => {
		const res = await app.request("/does-not-exist");

		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			error: { reason: "NOT_FOUND", message: "Route GET /does-not-exist not found" },
		});
	});
});
