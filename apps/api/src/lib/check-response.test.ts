import { createRoute, z } from "@hono/zod-openapi";
import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "../env";
import { createApp } from "./create-app";
import { AppError } from "./errors";
import { jsonResponseBody, jsonResponseError, noContentResponse } from "./openapi";

const Thing = z.object({ id: z.uuid() });
const VALID_ID = "01a13729-a36e-79c4-93c4-9e26297d2329";
const originalNodeEnv = env.NODE_ENV;

const app = createApp()
	.openapi(
		createRoute({
			method: "get",
			path: "/valid",
			responses: { 200: jsonResponseBody(Thing, "A thing") },
		}),
		(c) => c.json({ id: VALID_ID }, 200),
	)
	.openapi(
		createRoute({
			method: "get",
			path: "/invalid",
			responses: { 200: jsonResponseBody(Thing, "A thing") },
		}),
		// Passes the type check, because a UUID is only a string to TypeScript
		(c) => c.json({ id: "not-a-uuid" }, 200),
	)
	.openapi(
		createRoute({
			method: "get",
			path: "/empty",
			responses: { 204: noContentResponse("Nothing") },
		}),
		(c) => c.body(null, 204),
	)
	.openapi(
		createRoute({
			method: "get",
			path: "/undeclared-status",
			responses: { ...jsonResponseError("CONFLICT", "A conflict") },
		}),
		() => {
			throw new AppError("NOT_FOUND", "Not one of this route's declared statuses");
		},
	)
	.openapi(
		createRoute({
			method: "get",
			path: "/declared-error",
			responses: { ...jsonResponseError("NOT_FOUND", "Not found") },
		}),
		() => {
			throw new AppError("NOT_FOUND", "Matches the declared error");
		},
	);

afterEach(() => {
	env.NODE_ENV = originalNodeEnv;
	vi.restoreAllMocks();
});

describe("checkResponse", () => {
	it("lets a matching response through", async () => {
		const res = await app.request("/valid");

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ id: VALID_ID });
	});

	it("fails a mismatched response outside production and names the field", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await app.request("/invalid");

		expect(res.status).toBe(500);
		expect(await res.json()).toMatchObject({
			error: { reason: "INTERNAL_SERVER_ERROR", issues: [{ path: ["id"] }] },
		});
	});

	it("logs a mismatched response in production and still sends it", async () => {
		env.NODE_ENV = "production";
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await app.request("/invalid");

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ id: "not-a-uuid" });
		expect(consoleError).toHaveBeenCalledOnce();
	});

	it("skips responses without a JSON schema", async () => {
		const res = await app.request("/empty");

		expect(res.status).toBe(204);
	});

	it("skips statuses the route doesn't declare, since any route can fail unexpectedly", async () => {
		const res = await app.request("/undeclared-status");

		expect(res.status).toBe(404);
	});

	it("accepts a thrown error that matches the declared error schema", async () => {
		const res = await app.request("/declared-error");

		expect(res.status).toBe(404);
	});
});
