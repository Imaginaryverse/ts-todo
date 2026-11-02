import { Container, Flex, Heading, Link as RadixLink } from "@radix-ui/themes";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeToggle } from "../components/theme-toggle";

export const Route = createRootRoute({ component: RootLayout });

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
					<ThemeToggle />
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
