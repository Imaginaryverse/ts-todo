import { Text } from "@radix-ui/themes";

/** Shows the first validation error of a form field, if it has one. */
export function FieldError({ errors }: { errors: readonly ({ message?: string } | undefined)[] }) {
	const message = errors[0]?.message;

	if (!message) {
		return null;
	}

	return (
		<Text as="span" role="alert" size="1" color="red" style={{ display: "block" }}>
			{message}
		</Text>
	);
}
