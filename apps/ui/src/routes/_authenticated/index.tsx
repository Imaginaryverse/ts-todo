import { Button, Dialog, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import type { Todo } from "@ts-todo/schemas";

import { PendingMessage } from "../../components/pending-message";
import { getErrorMessage } from "../../lib/api-error";
import {
	todoListQueryOptions,
	useGetTodoListQuery,
	usePostTodoMutation,
} from "../../queries/todos";
import { NewTodoForm } from "./-components/new-todo-form";
import { TodoRow } from "./-components/todo-row";

export const Route = createFileRoute("/_authenticated/")({
	loader: ({ context }) => context.queryClient.ensureQueryData(todoListQueryOptions),
	component: TodoListPage,
});

function TodoGroup({ title, todos }: { title: string; todos: Todo[] }) {
	const headingId = `todo-group-${title.toLowerCase()}`;

	return (
		<section aria-labelledby={headingId}>
			<Heading as="h2" size="3" mb="2" id={headingId}>
				{title}
			</Heading>
			{todos.length === 0 ? (
				<Text size="2" color="gray">
					Nothing here yet.
				</Text>
			) : (
				<Flex asChild direction="column" gap="2">
					<ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
						{todos.map((todo) => (
							<TodoRow key={todo.id} todo={todo} />
						))}
					</ul>
				</Flex>
			)}
		</section>
	);
}

function TodoListPage() {
	const { data: todos, isPending, isError } = useGetTodoListQuery();
	const postTodo = usePostTodoMutation();

	return (
		<Flex direction="column" gap="5">
			<Dialog.Root>
				<Dialog.Trigger>
					<Button size="1" style={{ width: "fit-content" }}>
						New todo
					</Button>
				</Dialog.Trigger>

				<Dialog.Content maxWidth="450px">
					<Dialog.Title>New todo</Dialog.Title>
					<NewTodoForm
						onCreate={(input) =>
							postTodo.mutateAsync(input).then(
								() => true,
								() => false,
							)
						}
						errorMessage={postTodo.error ? getErrorMessage(postTodo.error) : undefined}
					/>
				</Dialog.Content>
			</Dialog.Root>

			{isPending && <PendingMessage />}
			{isError && (
				<Text role="alert">Your todos couldn't be refreshed, so this list may be out of date.</Text>
			)}
			{todos && (
				<Grid columns={{ initial: "1", md: "2" }} gap="4" maxWidth="1080px">
					<TodoGroup title="Active" todos={todos.filter((todo) => todo.completedAt === null)} />
					<TodoGroup title="Completed" todos={todos.filter((todo) => todo.completedAt !== null)} />
				</Grid>
			)}
		</Flex>
	);
}
