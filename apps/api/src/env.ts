import { z } from "zod";

// Production gets no defaults for auth settings, so a deploy can't silently run on development values
const isProduction = process.env.NODE_ENV === "production";

const EnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z.coerce.number().int().positive().default(3000),
	// Normalized to a bare origin (no path or trailing slash) so it compares equal to the Origin header
	APP_ORIGIN: z.url({ protocol: /^https?$/ }).transform((url) => new URL(url).origin),
	// Signs session cookies. Development and tests get a throwaway default; production must set its own.
	BETTER_AUTH_SECRET: isProduction
		? z
				.string({ error: "Required in production; generate one with `openssl rand -base64 32`" })
				.min(32, { error: "Too short; generate one with `openssl rand -base64 32`" })
		: z.string().min(32).default("development-only-secret-not-for-production"),
	// The API's own public URL; Better Auth uses it for callback URLs and origin checks. It only marks
	// session cookies `Secure` when this is https, so production must set an https URL.
	BETTER_AUTH_URL: isProduction
		? z.url({ protocol: /^https$/, error: "Must be the API's https:// URL in production" })
		: z.url({ protocol: /^https?$/ }).default("http://localhost:3000"),
	DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
	console.error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
	console.error("Copy .env.example to .env in the repo root and fill in the values.");
	process.exit(1);
}

export const env = result.data;
