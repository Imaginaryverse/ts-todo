import { todos, users } from "@ts-todo/db/schema";
import { Todo } from "@ts-todo/schemas";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { cookieFrom, signIn, signUp } from "../../test/helpers";
import app from "../app";
import { db } from "../db";
import { assertLocalDatabase, DEMO_PASSWORD, DEMO_USERS, seed } from "./seed";

const [alice, bob] = DEMO_USERS;

async function todosOf(email: string) {
	const res = await signIn({ email, password: DEMO_PASSWORD });
	expect(res.status).toBe(200);

	const list = await app.request("/todos", { headers: { Cookie: cookieFrom(res) } });
	expect(list.status).toBe(200);
	// Parsing proves the seeded data fits the same contract the UI relies on
	return Todo.array().parse(await list.json());
}

describe("seed", () => {
	it("creates demo users who can sign in and see only their own todos", async () => {
		await seed();

		const aliceTodos = await todosOf(alice.email);
		const bobTodos = await todosOf(bob.email);

		expect(aliceTodos.length).toBeGreaterThan(bobTodos.length);
		expect(bobTodos.length).toBeGreaterThan(0);
		const titles = new Set(aliceTodos.map((todo) => todo.title));
		expect(bobTodos.some((todo) => titles.has(todo.title))).toBe(false);
	});

	it("covers the states the UI has to show", async () => {
		await seed();

		const aliceTodos = await todosOf(alice.email);

		expect(aliceTodos.some((todo) => todo.completedAt !== null)).toBe(true);
		expect(aliceTodos.some((todo) => todo.completedAt === null)).toBe(true);
		expect(aliceTodos.some((todo) => todo.description === null)).toBe(true);
		expect(aliceTodos.some((todo) => todo.description?.includes("**"))).toBe(true);
		expect(aliceTodos.some((todo) => todo.title.length === 100)).toBe(true);
	});

	it("dates todos relative to now, with none in the future", async () => {
		await seed();

		const now = Date.now();
		const aliceTodos = await todosOf(alice.email);

		for (const todo of aliceTodos) {
			expect(new Date(todo.createdAt).getTime()).toBeLessThanOrEqual(now);
			expect(new Date(todo.updatedAt).getTime()).toBeLessThanOrEqual(now);
			if (todo.completedAt) {
				expect(new Date(todo.completedAt).getTime()).toBeLessThanOrEqual(now);
				expect(todo.completedAt >= todo.createdAt).toBe(true);
			}
		}
		const newest = new Date(aliceTodos[0]?.createdAt ?? 0).getTime();
		expect(now - newest).toBeLessThan(7 * 24 * 60 * 60 * 1000);
	});

	it("restores the demo data when run again", async () => {
		await seed();
		const before = await todosOf(alice.email);
		await db.delete(todos);

		await seed();

		const after = await todosOf(alice.email);
		expect(after.map((todo) => todo.title)).toEqual(before.map((todo) => todo.title));
		expect(await db.select().from(users)).toHaveLength(DEMO_USERS.length);
	});

	it("leaves other users and their todos alone", async () => {
		const res = await signUp();
		const cookie = cookieFrom(res);
		await app.request("/todos", {
			method: "POST",
			headers: { "Content-Type": "application/json", Cookie: cookie },
			body: JSON.stringify({ title: "My own todo" }),
		});

		await seed();
		await seed();

		const list = await app.request("/todos", { headers: { Cookie: cookie } });
		expect(
			Todo.array()
				.parse(await list.json())
				.map((todo) => todo.title),
		).toEqual(["My own todo"]);
		expect(await db.select().from(users).where(eq(users.email, "john@example.com"))).toHaveLength(
			1,
		);
	});
});

describe("assertLocalDatabase", () => {
	it.each([
		"postgres://user:pass@localhost:5432/ts_todo",
		"postgres://user:pass@127.0.0.1:5432/ts_todo",
		"postgres://user:pass@[::1]:5432/ts_todo",
	])("accepts %s", (url) => {
		expect(() => assertLocalDatabase(url)).not.toThrow();
	});

	it.each([
		"postgres://user:pass@db.example.com:5432/ts_todo",
		"postgres://localhost:pass@db.example.com:5432/ts_todo",
		"postgres://user:pass@localhost.example.com:5432/ts_todo",
		// `pg` lets a `host` query parameter override the host in the URL
		"postgres://user:pass@localhost:5432/ts_todo?host=db.example.com",
	])("rejects %s", (url) => {
		expect(() => assertLocalDatabase(url)).toThrow(/Refusing to seed/);
	});

	it("keeps the password out of the error message", () => {
		expect(() => assertLocalDatabase("postgres://user:s3cret@db.example.com/ts_todo")).toThrow(
			/^(?!.*s3cret)/,
		);
	});
});
