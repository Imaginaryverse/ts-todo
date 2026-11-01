import { accounts, sessions, users, verifications } from "@ts-todo/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";

import { db } from "./db";
import { env } from "./env";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: { users, sessions, accounts, verifications },
		usePlural: true,
	}),
	basePath: "/auth",
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: [env.APP_ORIGIN],
	emailAndPassword: { enabled: true },
	advanced: {
		// Let Postgres generate ids with the columns' uuidv7() default
		database: { generateId: false },
		// Better Auth skips the origin check when it detects a test run. Keep it on so tests exercise
		// the same CSRF protection as production.
		disableOriginCheck: false,
	},
	// Serves Better Auth's OpenAPI schema for the dev docs
	plugins: env.NODE_ENV === "development" ? [openAPI()] : [],
});

export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;
