import { createDb } from "@ts-todo/db";
import { todos, users } from "@ts-todo/db/schema";
import { Todo } from "@ts-todo/schemas";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { cookieFrom, signIn, signUp, TEST_USER } from "../../test/helpers";
import app from "../app";
import { db } from "../db";
import { env } from "../env";
import { assertLocalDatabase, DEMO_PASSWORD, DEMO_USERS, describeSeedFailure, seed } from "./seed";

const [alice, bob] = DEMO_USERS;

async function todosOf(email: string) {
	const res = await signIn({ email, password: DEMO_PASSWORD });
	expect(res.status).toBe(200);

	const list = await app.request("/todos", { headers: { Cookie: cookieFrom(res) } });
	expect(list.status).toBe(200);
	// Parsing proves the seeded data fits the same contract the UI relies on
	return Todo.array().parse(await list.json());
}

/** Everything a demo user sees that the seed decides, for comparing one run with another. */
async function demoData() {
	const lists = await Promise.all(DEMO_USERS.map((user) => todosOf(user.email)));
	return lists.map((list) =>
		list.map((todo) => ({
			title: todo.title,
			description: todo.description,
			completed: todo.completedAt !== null,
		})),
	);
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

		for (const { email } of DEMO_USERS) {
			const userTodos = await todosOf(email);

			for (const todo of userTodos) {
				expect(new Date(todo.createdAt).getTime()).toBeLessThanOrEqual(now);
				expect(new Date(todo.updatedAt).getTime()).toBeLessThanOrEqual(now);
				if (todo.completedAt) {
					expect(new Date(todo.completedAt).getTime()).toBeLessThanOrEqual(now);
					expect(todo.completedAt >= todo.createdAt).toBe(true);
				}
			}
			const newest = new Date(userTodos[0]?.createdAt ?? 0).getTime();
			expect(now - newest).toBeLessThan(7 * 24 * 60 * 60 * 1000);
		}
	});

	it("gives the same data when run twice", async () => {
		await seed();
		const before = await demoData();

		await seed();

		expect(await demoData()).toEqual(before);
		expect(await db.select().from(users)).toHaveLength(DEMO_USERS.length);
	});

	it("undoes changes made to the demo data", async () => {
		await seed();
		const before = await demoData();
		const res = await signIn({ email: alice.email, password: DEMO_PASSWORD });
		await app.request("/todos", {
			method: "POST",
			headers: { "Content-Type": "application/json", Cookie: cookieFrom(res) },
			body: JSON.stringify({ title: "An extra todo" }),
		});
		await db.update(todos).set({ title: "Changed", completedAt: null });

		await seed();

		expect(await demoData()).toEqual(before);
	});

	it("refuses a remote database before changing anything", async () => {
		await seed();
		const before = await db.select().from(users);
		const localUrl = env.DATABASE_URL;
		// The client is already connected to the test database, so nothing can reach this host
		env.DATABASE_URL = "postgres://user:pass@db.example.com:5432/ts_todo";

		try {
			await expect(seed()).rejects.toThrow(/Refusing to seed/);
		} finally {
			env.DATABASE_URL = localUrl;
		}

		expect(await db.select().from(users)).toEqual(before);
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
		expect(await db.select().from(users).where(eq(users.email, TEST_USER.email))).toHaveLength(1);
	});
});

describe("assertLocalDatabase", () => {
	it.each([
		"postgres://user:pass@localhost:5432/ts_todo",
		"postgres://user:pass@127.0.0.1:5432/ts_todo",
		"postgres://user:pass@[::1]:5432/ts_todo",
		"postgres://user:pass@localhost:5432/ts_todo?host=::1",
	])("accepts %s", (url) => {
		expect(() => assertLocalDatabase(url)).not.toThrow();
	});

	it.each([
		"postgres://user:pass@db.example.com:5432/ts_todo",
		"postgres://localhost:pass@db.example.com:5432/ts_todo",
		"postgres://user:pass@localhost.example.com:5432/ts_todo",
		// `pg` lets a `host` query parameter override the host in the URL
		"postgres://user:pass@localhost:5432/ts_todo?host=db.example.com",
		// `pg` uses the last `host`, not the first
		"postgres://user:pass@localhost:5432/ts_todo?host=localhost&host=db.example.com",
		"postgres://user:pass@db.example.com:5432/ts_todo?host=localhost&host=",
		// `pg` encodes these URLs before parsing them, so `h%6Fst` doesn't mean `host` to it
		"postgres://user:pass@db.example.com:5432/ts_todo?h%6Fst=localhost&x=%zz",
		"postgres://user:pass@db.example.com:5432/ts_todo?h%6Fst=localhost&x=a b",
	])("rejects %s", (url) => {
		expect(() => assertLocalDatabase(url)).toThrow(/Refusing to seed/);
	});

	it("keeps the password out of the error message", () => {
		expect(() => assertLocalDatabase("postgres://user:s3cret@db.example.com/ts_todo")).toThrow(
			/^(?!.*s3cret)/,
		);
	});
});

describe("describeSeedFailure", () => {
	it("suggests starting Postgres when it can't be reached", async () => {
		const { db: closedPortDb, pool } = createDb("postgres://user:pass@localhost:1/ts_todo");

		const error = await closedPortDb.execute(sql`select 1`).catch((caught: unknown) => caught);
		await pool.end();

		expect(describeSeedFailure(error)).toContain("pnpm services:up");
	});

	it("suggests running migrations when the tables are missing", async () => {
		const error = await db
			.execute(sql`select * from missing_table`)
			.catch((caught: unknown) => caught);

		expect(describeSeedFailure(error)).toContain("pnpm db:migrate");
	});

	it("copes with something that isn't an error", () => {
		expect(describeSeedFailure(null)).toBe("null");
	});

	it("explains a refused database without suggesting a fix that wouldn't help", () => {
		const message = describeSeedFailure(new Error("Refusing to seed the database"));

		expect(message).toBe("Refusing to seed the database");
	});
});
