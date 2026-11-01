import { z } from "zod";

const EnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z.coerce.number().int().positive().default(3000),
	// Normalized to a bare origin (no path or trailing slash) so it compares equal to the Origin header
	APP_ORIGIN: z.url({ protocol: /^https?$/ }).transform((url) => new URL(url).origin),
	DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
	console.error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
	console.error("Copy .env.example to .env in the repo root and fill in the values.");
	process.exit(1);
}

export const env = result.data;
