import { Container, Flex, Heading, Link as RadixLink } from "@radix-ui/themes";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeToggle } from "../components/theme-toggle";
import { UserMenu } from "../components/user-menu";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<Container size="2" p="4">
			<Flex asChild justify="between" align="center" gap="3" wrap="wrap" mb="5">
				<header>
					<Heading as="h1" size="5">
						<RadixLink asChild color="gray" highContrast underline="none">
							<Link to="/">TS Todo</Link>
						</RadixLink>
					</Heading>
					<Flex gap="4" align="center" wrap="wrap">
						<UserMenu />
						<ThemeToggle />
					</Flex>
				</header>
			</Flex>
			<main>
				<Outlet />
			</main>
			<TanStackRouterDevtools />
			<ReactQueryDevtools />
		</Container>
	);
}
