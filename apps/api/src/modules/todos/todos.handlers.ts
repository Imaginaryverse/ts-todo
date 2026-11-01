import type { todos } from "@ts-todo/db/schema";
import type { Todo } from "@ts-todo/schemas";
import type { Context } from "hono";

import { sendError } from "../../lib/errors";
import type { AppRouteHandler } from "../../types";
import type {
	DeleteTodoRoute,
	GetTodoDetailRoute,
	GetTodoListRoute,
	PatchTodoRoute,
	PostTodoRoute,
} from "./todos.routes";
import { createTodo, deleteTodo, getTodoDetail, getTodoList, updateTodo } from "./todos.service";

type TodoRow = typeof todos.$inferSelect;

// Picks fields explicitly so internal columns like `userId` never reach responses
function toTodoDto(row: TodoRow): Todo {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		completedAt: row.completedAt?.toISOString() ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function sendTodoNotFound(c: Context) {
	return sendError(c, { reason: "NOT_FOUND", message: "Could not find todo" });
}

export const getTodoListHandler: AppRouteHandler<GetTodoListRoute> = async (c) => {
	const user = c.get("user");

	const rows = await getTodoList(user.id);
	return c.json(rows.map(toTodoDto), 200);
};

export const getTodoDetailHandler: AppRouteHandler<GetTodoDetailRoute> = async (c) => {
	const user = c.get("user");
	const params = c.req.valid("param");

	const row = await getTodoDetail(user.id, params.id);

	if (!row) {
		return sendTodoNotFound(c);
	}

	return c.json(toTodoDto(row), 200);
};

export const postTodoHandler: AppRouteHandler<PostTodoRoute> = async (c) => {
	const user = c.get("user");
	const input = c.req.valid("json");

	const row = await createTodo(user.id, input);
	return c.json(toTodoDto(row), 201);
};

export const patchTodoHandler: AppRouteHandler<PatchTodoRoute> = async (c) => {
	const user = c.get("user");
	const params = c.req.valid("param");
	const input = c.req.valid("json");

	const row = await updateTodo(user.id, params.id, input);

	if (!row) {
		return sendTodoNotFound(c);
	}

	return c.json(toTodoDto(row), 200);
};

export const deleteTodoHandler: AppRouteHandler<DeleteTodoRoute> = async (c) => {
	const user = c.get("user");
	const params = c.req.valid("param");

	const row = await deleteTodo(user.id, params.id);

	if (!row) {
		return sendTodoNotFound(c);
	}

	return c.body(null, 204);
};
