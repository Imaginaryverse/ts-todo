import { createFileRoute, redirect } from "@tanstack/react-router";

import { sessionQueryOptions } from "../queries/session";

// A pathless layout: everything under `_authenticated/` requires a session
export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
		if (!session) {
			throw redirect({ to: "/sign-in", search: { redirect: location.href } });
		}
	},
});
