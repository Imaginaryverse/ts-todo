import { Box, Container, Flex, Heading, Link as RadixLink } from "@radix-ui/themes";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { HealthStatus } from "../components/health-status";
import { ThemeToggle } from "../components/theme-toggle";
import { UserMenu } from "../components/user-menu";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	component: RootLayout,
});

const LAYOUT_MAX_WIDTH = "1440px";
// Opaque and above the page, so content scrolls behind the bars instead of showing through them
const STICKY_BAR_STYLE = { background: "var(--color-background)", zIndex: 1 };

function RootLayout() {
	return (
		<Flex direction="column" minHeight="100dvh">
			{/* Sticky, not fixed: they stay at the window's edges without covering the page's content */}
			<Box asChild position="sticky" top="0" style={STICKY_BAR_STYLE}>
				<header>
					<Container px="4" py="3" maxWidth={LAYOUT_MAX_WIDTH}>
						<Flex justify="between" align="center" gap="3" wrap="wrap">
							<Heading as="h1" size="5">
								<RadixLink asChild color="gray" highContrast underline="none">
									<Link to="/">TS Todo</Link>
								</RadixLink>
							</Heading>
							<Flex gap="4" align="center" wrap="wrap">
								<UserMenu />
								<ThemeToggle />
							</Flex>
						</Flex>
					</Container>
				</header>
			</Box>
			<Box asChild flexGrow="1">
				<main>
					<Container px="4" py="3" maxWidth={LAYOUT_MAX_WIDTH}>
						<Outlet />
					</Container>
				</main>
			</Box>
			<Box asChild position="sticky" bottom="0" style={STICKY_BAR_STYLE}>
				<footer>
					<Container px="4" py="3" maxWidth={LAYOUT_MAX_WIDTH}>
						{/* Centered to stay clear of the devtools buttons in the corners */}
						<Flex justify="center">
							<HealthStatus />
						</Flex>
					</Container>
				</footer>
			</Box>

			<TanStackRouterDevtools />
			<ReactQueryDevtools />
		</Flex>
	);
}
