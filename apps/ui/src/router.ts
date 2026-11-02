import { createRouter } from "@tanstack/react-router";

import { ErrorMessage } from "./components/error-message";
import { NotFound } from "./components/not-found";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
	routeTree,
	defaultNotFoundComponent: NotFound,
	defaultErrorComponent: ErrorMessage,
});

// Gives every Link, navigate and useParams call the app's route types
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
