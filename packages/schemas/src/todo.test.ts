import { describe, expect, it } from "vitest";

import { PatchTodoInput, PostTodoInput, Todo, TodoIdParams } from "./todo";

describe("Todo", () => {
	const todo: Todo = {
		id: "01a13729-a36e-79c4-93c4-9e26297d2329",
		title: "Buy milk",
		description: null,
		completedAt: null,
		createdAt: "2026-11-01T10:00:00.000Z",
		updatedAt: "2026-11-01T10:00:00.000Z",
	};

	it("accepts a todo as serialized in API responses", () => {
		const sample = { ...todo, description: "From the **corner** shop" };
		const result = Todo.parse(sample);
		expect(result).toEqual(sample);
	});

	it("requires nullable fields to be present, even when null", () => {
		const { completedAt: _, ...sample } = todo;
		const result = Todo.safeParse(sample);
		expect(result.success).toBe(false);
	});

	it("strips the owner, which never leaves the API", () => {
		const sample = { ...todo, userId: "01a13729-a36e-79c4-93c4-9e26297d2330" };
		const result = Todo.parse(sample);
		expect(result).not.toHaveProperty("userId");
	});
});

describe("TodoIdParams", () => {
	it("rejects an id that isn't a UUID", () => {
		const result = TodoIdParams.safeParse({ id: "123" });
		expect(result.success).toBe(false);
	});
});

describe("PostTodoInput", () => {
	it("accepts a title without a description", () => {
		const result = PostTodoInput.parse({ title: "Buy milk" });
		expect(result).toEqual({ title: "Buy milk" });
	});

	it("trims the title", () => {
		const result = PostTodoInput.parse({ title: "  Buy milk  " });
		expect(result.title).toBe("Buy milk");
	});

	it("rejects a whitespace-only title, like the database does", () => {
		const result = PostTodoInput.safeParse({ title: "   " });
		expect(result.success).toBe(false);
	});

	it("accepts a 100-character title and rejects a 101-character one", () => {
		expect(PostTodoInput.safeParse({ title: "a".repeat(100) }).success).toBe(true);
		expect(PostTodoInput.safeParse({ title: "a".repeat(101) }).success).toBe(false);
	});

	it("rejects a description over 10,000 characters", () => {
		const result = PostTodoInput.safeParse({ title: "Buy milk", description: "a".repeat(10_001) });
		expect(result.success).toBe(false);
	});

	it("rejects a null description; leave it out instead", () => {
		const result = PostTodoInput.safeParse({ title: "Buy milk", description: null });
		expect(result.success).toBe(false);
	});
});

describe("PatchTodoInput", () => {
	it("accepts a single field", () => {
		const result = PatchTodoInput.parse({ completed: true });
		expect(result).toEqual({ completed: true });
	});

	it("accepts a null description, which clears it", () => {
		const result = PatchTodoInput.parse({ description: null });
		expect(result).toEqual({ description: null });
	});

	it("rejects an empty update", () => {
		const result = PatchTodoInput.safeParse({});
		expect(result.success).toBe(false);
	});

	it("rejects an update whose fields are all undefined", () => {
		const result = PatchTodoInput.safeParse({ title: undefined });
		expect(result.success).toBe(false);
	});

	it("ignores a client-sent completedAt, so the update is empty", () => {
		const result = PatchTodoInput.safeParse({ completedAt: "2026-11-01T10:00:00.000Z" });
		expect(result.success).toBe(false);
	});
});
