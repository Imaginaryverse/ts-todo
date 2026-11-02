import { existsSync } from "node:fs";
import path from "node:path";

const envFile = path.join(import.meta.dirname, "../../../.env");

if (existsSync(envFile)) {
	process.loadEnvFile(envFile);
}

/**
 * Validates `E2E_DATABASE_URL` so a test run can never point at the dev or API test database, since
 * it writes demo users and todos.
 */
function resolveE2eDatabaseUrl() {
	const url = process.env.E2E_DATABASE_URL;
	if (!url) {
		throw new Error("E2E_DATABASE_URL is not set. Copy it from .env.example into .env.");
	}

	const name = new URL(url).pathname.slice(1);
	if (!/^[a-z0-9_]+_e2e$/.test(name)) {
		throw new Error(
			`E2E_DATABASE_URL must name a database ending in "_e2e" (letters, digits, underscores), got "${name}".`,
		);
	}

	return url;
}

export const e2eDatabaseUrl = resolveE2eDatabaseUrl();
