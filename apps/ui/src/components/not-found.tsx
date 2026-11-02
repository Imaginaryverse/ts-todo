import { Flex, Link as RadixLink, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";

export function NotFound() {
	return (
		<Flex direction="column" gap="2">
			<Text as="p">Page not found.</Text>
			<RadixLink asChild>
				<Link to="/">Go to the home page</Link>
			</RadixLink>
		</Flex>
	);
}
