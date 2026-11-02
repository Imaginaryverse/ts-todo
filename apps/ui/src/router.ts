import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { DetailedError } from "hono/client";

import { ErrorMessage } from "./components/error-message";
import { NotFound } from "./components/not-found";
import { sessionQueryOptions } from "./queries/session";
import { routeTree } from "./routeTree.gen";

// The session ended while the app was open: mark the user as signed out, and let the route guard
// redirect them. This lives here because it needs both the query client and the router.
function handleError(error: Error) {
	if (error instanceof DetailedError && error.statusCode === 401) {
		queryClient.setQueryData(sessionQueryOptions.queryKey, null);
		void router.invalidate();
	}
}

export const queryClient = new QueryClient({
	queryCache: new QueryCache({ onError: handleError }),
	mutationCache: new MutationCache({ onError: handleError }),
	defaultOptions: {
		queries: {
			// Retrying won't change a 4xx, and it would delay the error by several seconds
			retry: (failureCount, error) => {
				const isClientError =
					error instanceof DetailedError &&
					error.statusCode !== undefined &&
					error.statusCode < 500;
				return !isClientError && failureCount < 3;
			},
		},
	},
});

export const router = createRouter({
	routeTree,
	context: { queryClient },
	defaultNotFoundComponent: NotFound,
	defaultErrorComponent: ErrorMessage,
});

// Gives every Link, navigate and useParams call the app's route types
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
