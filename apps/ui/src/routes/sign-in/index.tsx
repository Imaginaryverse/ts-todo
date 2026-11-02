import { Flex, Heading, Link as RadixLink, Text } from "@radix-ui/themes";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { RedirectSearch } from "../../lib/redirect-search";
import { sessionQueryOptions } from "../../queries/session";
import { SignInForm } from "./-components/sign-in-form";

export const Route = createFileRoute("/sign-in/")({
	validateSearch: RedirectSearch,
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
		if (session) {
			throw redirect({ to: "/" });
		}
	},
	component: SignInPage,
});

function SignInPage() {
	const { redirect: redirectTo } = Route.useSearch();

	return (
		<Flex direction="column" gap="4">
			<Heading as="h2" size="4">
				Sign in
			</Heading>
			<SignInForm redirectTo={redirectTo} />
			<Text size="2">
				New here?{" "}
				<RadixLink asChild>
					<Link to="/sign-up" search={{ redirect: redirectTo }}>
						Sign up
					</Link>
				</RadixLink>
			</Text>
		</Flex>
	);
}
