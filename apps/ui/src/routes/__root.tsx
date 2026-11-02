import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
	return (
		<>
			<header>
				<h1>
					<Link to="/">TS Todo</Link>
				</h1>
			</header>
			<main>
				<Outlet />
			</main>
			<TanStackRouterDevtools />
			<ReactQueryDevtools />
		</>
	);
}
