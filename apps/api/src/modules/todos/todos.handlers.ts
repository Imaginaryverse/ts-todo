import type { todos } from "@ts-todo/db/schema";
import type { Todo } from "@ts-todo/schemas";

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

export const getTodoListHandler: AppRouteHandler<GetTodoListRoute> = async (c) => {
	const user = c.get("user");

	const todos = await getTodoList(user.id);
	return c.json(todos.map(toTodoDto), 200);
};

export const getTodoDetailHandler: AppRouteHandler<GetTodoDetailRoute> = async (c) => {
	const user = c.get("user");
	const params = c.req.valid("param");

	const todo = await getTodoDetail(user.id, params.id);

	if (!todo) {
		return sendError(c, { reason: "NOT_FOUND", message: "Could not find todo" });
	}

	return c.json(toTodoDto(todo), 200);
};

export const postTodoHandler: AppRouteHandler<PostTodoRoute> = async (c) => {
	const user = c.get("user");
	const input = c.req.valid("json");

	const todo = await createTodo(user.id, input);
	return c.json(toTodoDto(todo), 201);
};

export const patchTodoHandler: AppRouteHandler<PatchTodoRoute> = async (c) => {
	const user = c.get("user");
	const params = c.req.valid("param");
	const input = c.req.valid("json");

	const todo = await updateTodo(user.id, params.id, input);

	if (!todo) {
		return sendError(c, { reason: "NOT_FOUND", message: "Could not find todo" });
	}

	return c.json(toTodoDto(todo), 200);
};

export const deleteTodoHandler: AppRouteHandler<DeleteTodoRoute> = async (c) => {
	const user = c.get("user");
	const params = c.req.valid("param");

	const todo = await deleteTodo(user.id, params.id);

	if (!todo) {
		return sendError(c, { reason: "NOT_FOUND", message: "Could not find todo" });
	}

	return c.body(null, 204);
};
