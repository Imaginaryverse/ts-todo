import { Button, Flex, Text } from "@radix-ui/themes";
import type { ErrorComponentProps } from "@tanstack/react-router";

export function ErrorMessage({ error, reset }: ErrorComponentProps) {
	const message = error instanceof Error ? error.message : "Unknown error";

	return (
		<Flex direction="column" gap="2" align="start" role="alert">
			<Text as="p">Something went wrong: {message}</Text>
			<Button variant="soft" onClick={reset}>
				Try again
			</Button>
		</Flex>
	);
}
