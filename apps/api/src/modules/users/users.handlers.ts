import type { User } from "@ts-todo/schemas";

import type { AuthUser } from "../../auth";
import type { AppRouteHandler } from "../../types";
import type { GetMeRoute } from "./users.routes";

// Picks fields explicitly so internal columns never reach responses
function toUserDto(user: AuthUser): User {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		emailVerified: user.emailVerified,
		createdAt: user.createdAt.toISOString(),
	};
}

export const getMeHandler: AppRouteHandler<GetMeRoute> = (c) => {
	const user = c.get("user");
	return c.json(toUserDto(user), 200);
};
