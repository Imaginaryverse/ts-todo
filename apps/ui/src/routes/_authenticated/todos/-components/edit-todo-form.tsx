import { Button, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { useForm } from "@tanstack/react-form";
import { PatchTodoInput, PostTodoInput, type Todo } from "@ts-todo/schemas";

import { FieldError } from "../../../../components/field-error";
import { getErrorMessage } from "../../../../lib/api-error";
import { usePatchTodoMutation } from "../../../../queries/todos";

// The API's rules, for a form whose fields always hold a string. Patching allows leaving fields out,
// but this form always sends both, so it validates against the stricter create rules.
const EditTodoFormValues = PostTodoInput.required();

export function EditTodoForm({ todo }: { todo: Todo }) {
	const patchTodo = usePatchTodoMutation();

	const form = useForm({
		defaultValues: { title: todo.title, description: todo.description ?? "" },
		validators: { onChange: EditTodoFormValues },
		// "Saved" only describes what's on screen until the next edit
		listeners: { onChange: () => patchTodo.reset() },
		onSubmit: ({ value, formApi }) => {
			// Validators don't apply transforms like `.trim()`, so parse to get the values to send.
			// An empty description is cleared, which the API expresses as null.
			const json = PatchTodoInput.parse({
				title: value.title,
				description: value.description === "" ? null : value.description,
			});
			patchTodo.mutate(
				{ id: todo.id, json },
				{
					// Show what was saved, which can differ from what was typed
					onSuccess: (saved) =>
						formApi.reset({ title: saved.title, description: saved.description ?? "" }),
				},
			);
		},
	});

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<Flex direction="column" gap="3" maxWidth="480px">
				<form.Field name="title">
					{(field) => (
						<Text as="label" size="2" weight="medium">
							Title
							<TextField.Root
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
							/>
							<FieldError field={field} />
						</Text>
					)}
				</form.Field>
				<form.Field name="description">
					{(field) => (
						<Text as="label" size="2" weight="medium">
							Description
							<TextArea
								rows={6}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
							/>
							<FieldError field={field} />
						</Text>
					)}
				</form.Field>
				{patchTodo.error && (
					<Text role="alert" size="2" color="red">
						{getErrorMessage(patchTodo.error)}
					</Text>
				)}
				{patchTodo.isSuccess && (
					<Text role="status" size="2" color="green">
						Saved
					</Text>
				)}
				<Button type="submit" loading={patchTodo.isPending}>
					Save
				</Button>
			</Flex>
		</form>
	);
}
