import { Text } from "@radix-ui/themes";
import { type AnyFieldApi, useStore } from "@tanstack/react-form";

/** Shows a form field's first validation error, once the user has left the field or submitted. */
export function FieldError({ field }: { field: AnyFieldApi }) {
	// Pressing Enter submits without leaving the field, so this needs to hear about submits itself
	const hasSubmitted = useStore(field.form.store, (state) => state.submissionAttempts > 0);
	const message = field.state.meta.errors[0]?.message;

	if (!message || !(field.state.meta.isBlurred || hasSubmitted)) {
		return null;
	}

	return (
		<Text as="span" role="alert" size="1" color="red" style={{ display: "block" }}>
			{message}
		</Text>
	);
}
