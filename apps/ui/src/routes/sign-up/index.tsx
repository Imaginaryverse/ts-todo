import { Flex, Heading, Link as RadixLink, Text } from "@radix-ui/themes";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { RedirectSearch } from "../../lib/redirect-search";
import { sessionQueryOptions } from "../../queries/session";
import { SignUpForm } from "./-components/sign-up-form";

export const Route = createFileRoute("/sign-up/")({
	validateSearch: RedirectSearch,
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
		if (session) {
			throw redirect({ to: "/" });
		}
	},
	component: SignUpPage,
});

function SignUpPage() {
	const { redirect: redirectTo } = Route.useSearch();

	return (
		<Flex direction="column" gap="4">
			<Heading as="h2" size="4">
				Sign up
			</Heading>
			<SignUpForm redirectTo={redirectTo} />
			<Text size="2">
				Already have an account?{" "}
				<RadixLink asChild>
					<Link to="/sign-in" search={{ redirect: redirectTo }}>
						Sign in
					</Link>
				</RadixLink>
			</Text>
		</Flex>
	);
}
