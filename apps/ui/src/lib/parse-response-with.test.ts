import type { AppType } from "@ts-todo/api/app";
import { GetHealthResponse, Todo } from "@ts-todo/schemas";
import { DetailedError, hc } from "hono/client";
import { expect, test, vi } from "vitest";

import { InvalidResponseError } from "./api-error";
import { parseResponseWith } from "./parse-response-with";

const todo: Todo = {
	id: "01a13729-a36e-79c4-93c4-9e26297d2329",
	title: "Buy milk",
	description: null,
	completedAt: null,
	createdAt: "2026-11-01T10:00:00.000Z",
	updatedAt: "2026-11-01T10:00:00.000Z",
};

function apiResponding(body: unknown, status = 200) {
	return hc<AppType>("http://localhost", {
		fetch: () => Promise.resolve(Response.json(body, { status })),
	});
}

test("returns a body that matches the schema", async () => {
	const api = apiResponding([todo]);

	await expect(parseResponseWith(Todo.array(), api.todos.$get())).resolves.toEqual([todo]);
});

test("ignores fields the schema doesn't know, so the API can add them safely", async () => {
	const api = apiResponding([{ ...todo, priority: 1 }]);

	await expect(parseResponseWith(Todo.array(), api.todos.$get())).resolves.toEqual([todo]);
});

test("rejects a body that doesn't match the schema", async () => {
	const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
	const { title: _, ...withoutTitle } = todo;
	const api = apiResponding([withoutTitle]);

	await expect(parseResponseWith(Todo.array(), api.todos.$get())).rejects.toBeInstanceOf(
		InvalidResponseError,
	);
	expect(consoleError).toHaveBeenCalledOnce();
	consoleError.mockRestore();
});

test("leaves API errors as they are", async () => {
	const api = apiResponding({ error: { reason: "UNAUTHORIZED", message: "Sign in" } }, 401);

	await expect(parseResponseWith(Todo.array(), api.todos.$get())).rejects.toBeInstanceOf(
		DetailedError,
	);
});

// Never called: `pnpm tc` checks that a schema can't be paired with the wrong route.
export function wrongSchemasDontCompile(api: ReturnType<typeof apiResponding>) {
	// @ts-expect-error A single todo isn't the list this route returns
	void parseResponseWith(Todo, api.todos.$get());
	// @ts-expect-error The health response isn't a list of todos
	void parseResponseWith(GetHealthResponse, api.todos.$get());
}
