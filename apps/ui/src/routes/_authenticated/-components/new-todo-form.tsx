import { Button, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { useForm } from "@tanstack/react-form";
import { PostTodoInput } from "@ts-todo/schemas";

import { FieldError } from "../../../components/field-error";

// The API's rules, for a form whose fields always hold a string
const NewTodoFormValues = PostTodoInput.required();

interface NewTodoFormProps {
	/** Resolves to whether the todo was created, so the form only clears on success. */
	onCreate: (input: PostTodoInput) => Promise<boolean>;
	errorMessage: string | undefined;
}

export function NewTodoForm({ onCreate, errorMessage }: NewTodoFormProps) {
	const form = useForm({
		defaultValues: { title: "", description: "" },
		validators: { onChange: NewTodoFormValues },
		onSubmit: async ({ value, formApi }) => {
			// Validators don't apply transforms like `.trim()`, so parse to get the values to send
			const input = PostTodoInput.parse({
				title: value.title,
				description: value.description === "" ? undefined : value.description,
			});

			if (await onCreate(input)) {
				formApi.reset();
			}
		},
	});

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<Flex direction="column" gap="3">
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
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
							/>
							<FieldError field={field} />
						</Text>
					)}
				</form.Field>
				{errorMessage && (
					<Text role="alert" size="2" color="red">
						{errorMessage}
					</Text>
				)}
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => (
						<Button type="submit" loading={isSubmitting}>
							Add todo
						</Button>
					)}
				</form.Subscribe>
			</Flex>
		</form>
	);
}
