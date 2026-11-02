import { Checkbox, Flex, Link as RadixLink, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import type { Todo } from "@ts-todo/schemas";

import { getErrorMessage } from "../../../lib/api-error";
import { usePatchTodoMutation } from "../../../queries/todos";

export function TodoRow({ todo }: { todo: Todo }) {
	const patchTodo = usePatchTodoMutation();
	const completed = todo.completedAt !== null;

	return (
		<Flex asChild gap="2" align="start">
			<li>
				<Checkbox
					mt="1"
					aria-label={`${completed ? "Reopen" : "Complete"} ${todo.title}`}
					checked={completed}
					disabled={patchTodo.isPending}
					onCheckedChange={(checked) =>
						patchTodo.mutate({ id: todo.id, json: { completed: checked === true } })
					}
				/>
				<Flex direction="column" gap="1">
					<Text style={{ overflowWrap: "anywhere" }}>
						<RadixLink asChild color={completed ? "gray" : undefined}>
							<Link to="/todos/$todoId" params={{ todoId: todo.id }}>
								{todo.title}
							</Link>
						</RadixLink>
					</Text>
					{patchTodo.error && (
						<Text role="alert" size="1" color="red">
							{getErrorMessage(patchTodo.error)}
						</Text>
					)}
				</Flex>
			</li>
		</Flex>
	);
}
