import { createRoute } from "@hono/zod-openapi";
import { TodoIdParams, PostTodoInput, PatchTodoInput, Todo } from "@ts-todo/schemas";

import {
	jsonRequestBody,
	jsonResponseBody,
	jsonResponseError,
	noContentResponse,
} from "../../lib/openapi";
import { requireAuth } from "../../middleware/require-auth";

const tags = ["todos"];

export const getTodoListRoute = createRoute({
	method: "get",
	path: "/",
	tags,
	middleware: requireAuth,
	responses: {
		200: jsonResponseBody(Todo.array(), "List of the user's todos"),
		...jsonResponseError("UNAUTHORIZED", "No valid session"),
	},
});
export type GetTodoListRoute = typeof getTodoListRoute;

export const getTodoDetailRoute = createRoute({
	method: "get",
	path: "/{id}",
	tags,
	middleware: requireAuth,
	request: {
		params: TodoIdParams,
	},
	responses: {
		200: jsonResponseBody(Todo, "A todo belonging to the user"),
		...jsonResponseError("BAD_REQUEST", "Invalid request"),
		...jsonResponseError("UNAUTHORIZED", "No valid session"),
		...jsonResponseError("NOT_FOUND", "The todo could not be found"),
	},
});
export type GetTodoDetailRoute = typeof getTodoDetailRoute;

export const postTodoRoute = createRoute({
	method: "post",
	path: "/",
	tags,
	middleware: requireAuth,
	request: {
		body: jsonRequestBody(PostTodoInput, "The todo to create", { required: true }),
	},
	responses: {
		201: jsonResponseBody(Todo, "The new todo"),
		...jsonResponseError("BAD_REQUEST", "Invalid request"),
		...jsonResponseError("UNAUTHORIZED", "No valid session"),
	},
});
export type PostTodoRoute = typeof postTodoRoute;

export const patchTodoRoute = createRoute({
	method: "patch",
	path: "/{id}",
	tags,
	middleware: requireAuth,
	request: {
		params: TodoIdParams,
		body: jsonRequestBody(PatchTodoInput, "The todo fields to patch", { required: true }),
	},
	responses: {
		200: jsonResponseBody(Todo, "The updated todo"),
		...jsonResponseError("BAD_REQUEST", "Invalid request"),
		...jsonResponseError("UNAUTHORIZED", "No valid session"),
		...jsonResponseError("NOT_FOUND", "The todo could not be found"),
	},
});
export type PatchTodoRoute = typeof patchTodoRoute;

export const deleteTodoRoute = createRoute({
	method: "delete",
	path: "/{id}",
	tags,
	middleware: requireAuth,
	request: {
		params: TodoIdParams,
	},
	responses: {
		204: noContentResponse("The todo was deleted"),
		...jsonResponseError("BAD_REQUEST", "Invalid request"),
		...jsonResponseError("UNAUTHORIZED", "No valid session"),
		...jsonResponseError("NOT_FOUND", "The todo could not be found"),
	},
});
export type DeleteTodoRoute = typeof deleteTodoRoute;
