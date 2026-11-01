import { createRouter } from "../../lib/create-router";
import {
	deleteTodoHandler,
	getTodoDetailHandler,
	getTodoListHandler,
	patchTodoHandler,
	postTodoHandler,
} from "./todos.handlers";
import {
	deleteTodoRoute,
	getTodoDetailRoute,
	getTodoListRoute,
	patchTodoRoute,
	postTodoRoute,
} from "./todos.routes";

export const todosRouter = createRouter()
	.openapi(getTodoListRoute, getTodoListHandler)
	.openapi(getTodoDetailRoute, getTodoDetailHandler)
	.openapi(postTodoRoute, postTodoHandler)
	.openapi(patchTodoRoute, patchTodoHandler)
	.openapi(deleteTodoRoute, deleteTodoHandler);
