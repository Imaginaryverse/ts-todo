import { describe, expect, it } from "vitest";

import { User } from "./user";

describe("User", () => {
	const user: User = {
		id: "01a13729-a36e-79c4-93c4-9e26297d2329",
		email: "john.doe@example.com",
		name: "John Doe",
		emailVerified: false,
		createdAt: "2026-10-31T22:00:00.000Z",
	};

	it("accepts a user as serialized in API responses", () => {
		const sample = { ...user };
		const result = User.parse(sample);
		expect(result).toEqual(user);
	});

	it("rejects a malformed email", () => {
		const sample = { ...user, email: "not-an-email" };
		const result = User.safeParse(sample);
		expect(result.success).toBe(false);
	});

	it("strips fields that must never leave the API", () => {
		const sample = { ...user, password: "abc123" };
		const result = User.parse(sample);
		expect(result).not.toHaveProperty("password");
	});
});
