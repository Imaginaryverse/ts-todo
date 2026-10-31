import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

const envFile = "../../.env";

if (existsSync(envFile)) {
	process.loadEnvFile(envFile);
}

const url = process.env.DATABASE_URL;

if (!url) {
	throw new Error("DATABASE_URL is not set. Copy .env.example to .env in the repo root.");
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/schema/index.ts",
	out: "./migrations",
	dbCredentials: { url },
});
