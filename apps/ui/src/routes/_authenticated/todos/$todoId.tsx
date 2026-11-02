import { Flex, Link as RadixLink, Text } from "@radix-ui/themes";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TodoIdParams } from "@ts-todo/schemas";
import { DetailedError } from "hono/client";

import { todoDetailQueryOptions, useGetTodoDetailQuery } from "../../../queries/todos";
import { DeleteTodoDialog } from "./-components/delete-todo-dialog";
import { EditTodoForm } from "./-components/edit-todo-form";

export const Route = createFileRoute("/_authenticated/todos/$todoId")({
	loader: async ({ context, params }) => {
		// The same rule the API applies to this param, so a malformed id never reaches it
		if (!TodoIdParams.safeParse({ id: params.todoId }).success) {
			throw notFound();
		}

		try {
			await context.queryClient.ensureQueryData(todoDetailQueryOptions(params.todoId));
		} catch (error) {
			if (error instanceof DetailedError && error.statusCode === 404) {
				throw notFound();
			}
			throw error;
		}
	},
	component: TodoDetailPage,
});

function TodoDetailPage() {
	const { todoId } = Route.useParams();
	const { data: todo, isPending, isError } = useGetTodoDetailQuery(todoId);

	if (isPending) return <Text>Loading...</Text>;
	if (isError) return <Text role="alert">This todo couldn't be loaded.</Text>;

	return (
		<Flex direction="column" gap="4">
			<RadixLink asChild size="2">
				<Link to="/">Back to your todos</Link>
			</RadixLink>
			<EditTodoForm todo={todo} />
			<Flex>
				<DeleteTodoDialog todo={todo} />
			</Flex>
		</Flex>
	);
}
