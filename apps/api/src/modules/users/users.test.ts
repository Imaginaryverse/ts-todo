import { User } from "@ts-todo/schemas";
import { describe, expect, it } from "vitest";

import { signedInCookie, signOut, TEST_USER } from "../../../test/helpers";
import app from "../../app";

function getMe(cookie?: string) {
	return app.request("/users/me", { headers: cookie ? { Cookie: cookie } : {} });
}

describe("GET /users/me", () => {
	it("returns 401 without a session", async () => {
		const res = await getMe();

		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: { reason: "UNAUTHORIZED", message: "Authentication required" },
		});
	});

	it("returns 401 for an invalid session cookie", async () => {
		const res = await getMe("better-auth.session_token=not-a-real-token");

		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({
			error: { reason: "UNAUTHORIZED", message: "Authentication required" },
		});
	});

	it("returns exactly the fields of the shared User schema", async () => {
		const cookie = await signedInCookie();

		const res = await getMe(cookie);

		expect(res.status).toBe(200);
		const body = (await res.json()) as Record<string, unknown>;
		expect(Object.keys(body).toSorted()).toEqual([
			"createdAt",
			"email",
			"emailVerified",
			"id",
			"name",
		]);
		expect(User.parse(body)).toEqual(body);
		expect(body).toMatchObject({
			email: TEST_USER.email,
			name: TEST_USER.name,
			emailVerified: false,
		});
	});

	it("returns 401 after signing out", async () => {
		const cookie = await signedInCookie();

		const signOutRes = await signOut(cookie);
		expect(signOutRes.status).toBe(200);

		const res = await getMe(cookie);
		expect(res.status).toBe(401);
	});
});
