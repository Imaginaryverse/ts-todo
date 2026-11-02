import { AlertDialog, Button, Flex, Text } from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { Todo } from "@ts-todo/schemas";

import { todoKeys, useDeleteTodoMutation } from "../../../../queries/todos";

export function DeleteTodoDialog({ todo }: { todo: Todo }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const deleteTodo = useDeleteTodoMutation();

	return (
		<AlertDialog.Root>
			<AlertDialog.Trigger>
				<Button color="red" variant="soft">
					Delete
				</Button>
			</AlertDialog.Trigger>
			<AlertDialog.Content maxWidth="420px">
				<AlertDialog.Title>Delete this todo?</AlertDialog.Title>
				<AlertDialog.Description size="2" style={{ overflowWrap: "anywhere" }}>
					"{todo.title}" will be permanently deleted.
				</AlertDialog.Description>
				{deleteTodo.error && (
					<Text as="p" role="alert" size="2" color="red" mt="2">
						{deleteTodo.error.message}
					</Text>
				)}
				<Flex gap="3" mt="4" justify="end">
					<AlertDialog.Cancel>
						<Button variant="soft" color="gray">
							Cancel
						</Button>
					</AlertDialog.Cancel>
					{/* Not AlertDialog.Action, so the dialog stays open and can show a failed delete */}
					<Button
						color="red"
						loading={deleteTodo.isPending}
						onClick={() =>
							deleteTodo.mutate(todo.id, {
								onSuccess: async () => {
									await navigate({ to: "/" });
									queryClient.removeQueries({ queryKey: todoKeys.detail(todo.id) });
								},
							})
						}
					>
						Delete
					</Button>
				</Flex>
			</AlertDialog.Content>
		</AlertDialog.Root>
	);
}
