import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type PatchTodoInput, type PostTodoInput, Todo } from "@ts-todo/schemas";
import { parseResponse } from "hono/client";

import { api } from "../lib/api-client";
import { parseResponseWith } from "../lib/parse-response-with";

export const todoKeys = {
	all: ["todos"] as const,
	list: () => [...todoKeys.all, "list"] as const,
	detail: (id: string) => [...todoKeys.all, "detail", id] as const,
};

export const todoListQueryOptions = queryOptions({
	queryKey: todoKeys.list(),
	queryFn: () => parseResponseWith(Todo.array(), api.todos.$get()),
});

export function todoDetailQueryOptions(id: string) {
	return queryOptions({
		queryKey: todoKeys.detail(id),
		queryFn: () => parseResponseWith(Todo, api.todos[":id"].$get({ param: { id } })),
	});
}

export function useGetTodoListQuery() {
	return useQuery(todoListQueryOptions);
}

export function useGetTodoDetailQuery(id: string) {
	return useQuery(todoDetailQueryOptions(id));
}

export function usePostTodoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (json: PostTodoInput) => parseResponseWith(Todo, api.todos.$post({ json })),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.list() }),
	});
}

export function usePatchTodoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, json }: { id: string; json: PatchTodoInput }) =>
			parseResponseWith(Todo, api.todos[":id"].$patch({ param: { id }, json })),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
	});
}

export function useDeleteTodoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => parseResponse(api.todos[":id"].$delete({ param: { id } })),
		// Only the list: refetching the deleted todo's detail query would respond with a 404. Callers
		// remove that query once they've navigated away from it.
		onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.list() }),
	});
}
