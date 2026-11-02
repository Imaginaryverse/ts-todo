import { Button, Flex, Link as RadixLink, Text } from "@radix-ui/themes";
import { Link, useNavigate } from "@tanstack/react-router";

import { useGetSessionQuery, useSignOutMutation } from "../queries/session";

export function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = useGetSessionQuery();
	const signOut = useSignOutMutation();

	if (isPending) {
		return null;
	}

	if (!session) {
		return (
			<Flex gap="3" align="center">
				<RadixLink asChild size="2">
					<Link to="/sign-in">Sign in</Link>
				</RadixLink>
				<RadixLink asChild size="2">
					<Link to="/sign-up">Sign up</Link>
				</RadixLink>
			</Flex>
		);
	}

	return (
		<Flex gap="3" align="center">
			{signOut.error && (
				<Text role="alert" size="1" color="red">
					{signOut.error.message}
				</Text>
			)}
			<Text size="2">{session.user.name}</Text>
			<Button
				size="1"
				variant="soft"
				loading={signOut.isPending}
				onClick={() =>
					signOut.mutate(undefined, {
						onSuccess: () => navigate({ to: "/sign-in" }),
					})
				}
			>
				Sign out
			</Button>
		</Flex>
	);
}
