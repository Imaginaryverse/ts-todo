import { Todo } from "@ts-todo/schemas";
import { beforeEach, describe, expect, it } from "vitest";

import { signedInCookie } from "../../../test/helpers";
import app from "../../app";

const OTHER_USER = { name: "Jane Doe", email: "jane@example.com" };

let cookie: string;

beforeEach(async () => {
	cookie = await signedInCookie();
});

function request(method: string, path: string, options: { cookie?: string; body?: unknown } = {}) {
	const headers: Record<string, string> = {};
	if (options.cookie) {
		headers.Cookie = options.cookie;
	}
	if (options.body !== undefined) {
		headers["Content-Type"] = "application/json";
	}
	return app.request(path, {
		method,
		headers,
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
	});
}

async function createTodo(body: object, as = cookie) {
	const res = await request("POST", "/todos", { cookie: as, body });
	expect(res.status).toBe(201);
	return Todo.parse(await res.json());
}

function patchTodo(id: string, body: object) {
	return request("PATCH", `/todos/${id}`, { cookie, body });
}

describe("authentication", () => {
	it("requires a session on every route", async () => {
		const id = "01a13729-a36e-79c4-93c4-9e26297d2329";
		const responses = await Promise.all([
			request("GET", "/todos"),
			request("GET", `/todos/${id}`),
			request("POST", "/todos", { body: { title: "Buy milk" } }),
			request("PATCH", `/todos/${id}`, { body: { completed: true } }),
			request("DELETE", `/todos/${id}`),
		]);

		expect(responses.map((res) => res.status)).toEqual([401, 401, 401, 401, 401]);
	});
});

describe("POST /todos", () => {
	it("creates a todo that isn't completed", async () => {
		const todo = await createTodo({ title: "Buy milk", description: "From the **corner** shop" });

		expect(todo).toMatchObject({
			title: "Buy milk",
			description: "From the **corner** shop",
			completedAt: null,
		});
	});

	it("stores a missing or empty description as null", async () => {
		const withoutDescription = await createTodo({ title: "Buy milk" });
		const withEmptyDescription = await createTodo({ title: "Buy bread", description: "" });

		expect(withoutDescription.description).toBeNull();
		expect(withEmptyDescription.description).toBeNull();
	});

	it("rejects a blank title with a validation issue", async () => {
		const res = await request("POST", "/todos", { cookie, body: { title: "   " } });

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { issues: { path: unknown[] }[] } };
		expect(body.error.issues.map((issue) => issue.path)).toEqual([["title"]]);
	});

	it("rejects a request with no body", async () => {
		const res = await request("POST", "/todos", { cookie });

		expect(res.status).toBe(400);
	});
});

describe("GET /todos", () => {
	it("lists only the user's own todos, newest first", async () => {
		await createTodo({ title: "First" });
		await createTodo({ title: "Second" });
		await createTodo({ title: "Someone else's" }, await signedInCookie(OTHER_USER));

		const res = await request("GET", "/todos", { cookie });

		expect(res.status).toBe(200);
		const todos = Todo.array().parse(await res.json());
		expect(todos.map((todo) => todo.title)).toEqual(["Second", "First"]);
	});
});

describe("GET /todos/:id", () => {
	it("returns the user's todo", async () => {
		const todo = await createTodo({ title: "Buy milk" });

		const res = await request("GET", `/todos/${todo.id}`, { cookie });

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(todo);
	});

	it("returns 404 for another user's todo, without revealing that it exists", async () => {
		const todo = await createTodo({ title: "Buy milk" }, await signedInCookie(OTHER_USER));

		const res = await request("GET", `/todos/${todo.id}`, { cookie });

		expect(res.status).toBe(404);
	});

	it("rejects an id that isn't a UUID", async () => {
		const res = await request("GET", "/todos/not-a-uuid", { cookie });

		expect(res.status).toBe(400);
	});
});

describe("PATCH /todos/:id", () => {
	it("updates only the fields that were sent", async () => {
		const todo = await createTodo({ title: "Buy milk", description: "Semi-skimmed" });

		const res = await patchTodo(todo.id, { title: "Buy oat milk" });

		expect(res.status).toBe(200);
		expect(await res.json()).toMatchObject({ title: "Buy oat milk", description: "Semi-skimmed" });
	});

	it("clears the description with null", async () => {
		const todo = await createTodo({ title: "Buy milk", description: "Semi-skimmed" });

		const res = await patchTodo(todo.id, { description: null });

		expect(await res.json()).toMatchObject({ description: null });
	});

	it("sets completedAt when completed, and keeps it when completed again", async () => {
		const todo = await createTodo({ title: "Buy milk" });

		const firstRes = await patchTodo(todo.id, { completed: true });
		const first = Todo.parse(await firstRes.json());
		const secondRes = await patchTodo(todo.id, { completed: true });
		const second = Todo.parse(await secondRes.json());

		expect(first.completedAt).not.toBeNull();
		expect(second.completedAt).toBe(first.completedAt);
	});

	it("clears completedAt when marked as not completed", async () => {
		const todo = await createTodo({ title: "Buy milk" });
		await patchTodo(todo.id, { completed: true });

		const res = await patchTodo(todo.id, { completed: false });

		expect(await res.json()).toMatchObject({ completedAt: null });
	});

	it("returns 404 for another user's todo and leaves it unchanged", async () => {
		const otherCookie = await signedInCookie(OTHER_USER);
		const todo = await createTodo({ title: "Buy milk" }, otherCookie);

		const res = await patchTodo(todo.id, { title: "Hijacked" });

		expect(res.status).toBe(404);
		const unchanged = await request("GET", `/todos/${todo.id}`, { cookie: otherCookie });
		expect(await unchanged.json()).toMatchObject({ title: "Buy milk" });
	});
});

describe("DELETE /todos/:id", () => {
	it("deletes the todo and responds with no content", async () => {
		const todo = await createTodo({ title: "Buy milk" });

		const res = await request("DELETE", `/todos/${todo.id}`, { cookie });

		expect(res.status).toBe(204);
		expect(await res.text()).toBe("");
		const gone = await request("GET", `/todos/${todo.id}`, { cookie });
		expect(gone.status).toBe(404);
	});

	it("returns 404 for another user's todo and leaves it in place", async () => {
		const otherCookie = await signedInCookie(OTHER_USER);
		const todo = await createTodo({ title: "Buy milk" }, otherCookie);

		const res = await request("DELETE", `/todos/${todo.id}`, { cookie });

		expect(res.status).toBe(404);
		const stillThere = await request("GET", `/todos/${todo.id}`, { cookie: otherCookie });
		expect(stillThere.status).toBe(200);
	});
});
