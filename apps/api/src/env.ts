import { z } from "zod";

const EnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z.coerce.number().int().positive().default(3000),
	// Normalized to a bare origin (no path or trailing slash) so it compares equal to the Origin header
	APP_ORIGIN: z.url({ protocol: /^https?$/ }).transform((url) => new URL(url).origin),
	// Signs session cookies
	BETTER_AUTH_SECRET: z.string().min(32),
	// The API's own public URL; Better Auth uses it for callback URLs and origin checks
	BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }).default("http://localhost:3000"),
	DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
	console.error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
	console.error("Copy .env.example to .env in the repo root and fill in the values.");
	process.exit(1);
}

export const env = result.data;
