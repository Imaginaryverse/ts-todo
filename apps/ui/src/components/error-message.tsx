import { Button, Flex, Text } from "@radix-ui/themes";
import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";

import { getErrorMessage } from "../lib/api-error";

export function ErrorMessage({ error }: ErrorComponentProps) {
	const router = useRouter();

	return (
		<Flex direction="column" gap="2" align="start" role="alert">
			<Text as="p">Something went wrong: {getErrorMessage(error)}</Text>
			{/* Re-runs the route's loader, which resetting the error boundary alone wouldn't do */}
			<Button variant="soft" onClick={() => void router.invalidate()}>
				Try again
			</Button>
		</Flex>
	);
}
