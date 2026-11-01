import type { AppRouteHandler } from "../../types";
import type { GetMeRoute } from "./users.routes";

export const getMeHandler: AppRouteHandler<GetMeRoute> = (c) => {
	const user = c.get("user");

	// Pick fields explicitly: responses aren't validated at runtime, so spreading `user` would leak
	// columns that aren't part of the User contract.
	return c.json(
		{
			id: user.id,
			email: user.email,
			name: user.name,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt.toISOString(),
		},
		200,
	);
};
