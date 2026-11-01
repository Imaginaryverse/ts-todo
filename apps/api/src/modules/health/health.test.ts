import { describe, expect, it, vi } from "vitest";

import app from "../../app";
import * as healthService from "./health.service";

describe("GET /health", () => {
	it("returns OK when the database is reachable", async () => {
		const res = await app.request("/health");

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ status: "OK" });
	});

	it("returns 503 when the database is unreachable", async () => {
		vi.spyOn(healthService, "isDatabaseReachable").mockResolvedValueOnce(false);

		const res = await app.request("/health");

		expect(res.status).toBe(503);
		expect(await res.json()).toEqual({
			error: { reason: "SERVICE_UNAVAILABLE", message: "Service unavailable" },
		});
	});
});
