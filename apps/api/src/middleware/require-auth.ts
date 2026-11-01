import { createMiddleware } from "hono/factory";

import { auth } from "../auth";
import { AppError } from "../lib/errors";
import type { AppEnvAuth } from "../types";

/**
 * Loads the session from the request's cookies, or responds 401. Use it as a route's `middleware`
 * so the handler can read `c.get("user")` and `c.get("session")`.
 */
export const requireAuth = createMiddleware<AppEnvAuth>(async (c, next) => {
	// This can extend the session in the database, but the refreshed cookie isn't sent from here.
	// Clients keep their cookie fresh by calling Better Auth's /auth/get-session, as its client does.
	const result = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!result) {
		throw new AppError("UNAUTHORIZED", "Authentication required");
	}

	c.set("user", result.user);
	c.set("session", result.session);

	await next();
});
