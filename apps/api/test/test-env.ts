import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

const envFile = path.join(import.meta.dirname, "../../../.env");
const fileEnv = existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")) : {};
const source = { ...fileEnv, ...process.env };

function databaseName(url: string) {
	return new URL(url).pathname.slice(1);
}

/**
 * Validates `TEST_DATABASE_URL` so a test run can never point at the dev database. Throws instead
 * of falling back to `DATABASE_URL`.
 */
function resolveTestDatabaseUrl() {
	const testUrl = source.TEST_DATABASE_URL;
	if (!testUrl) {
		throw new Error("TEST_DATABASE_URL is not set. Copy it from .env.example into .env.");
	}

	const name = databaseName(testUrl);
	if (!/^[a-z0-9_]+_test$/.test(name)) {
		throw new Error(
			`TEST_DATABASE_URL must name a database ending in "_test" (letters, digits, underscores), got "${name}".`,
		);
	}

	if (source.DATABASE_URL && databaseName(source.DATABASE_URL) === name) {
		throw new Error("TEST_DATABASE_URL must point at a different database than DATABASE_URL.");
	}

	return testUrl;
}

export const testDatabaseUrl = resolveTestDatabaseUrl();

/** Environment for test workers: the `.env` values, with `DATABASE_URL` swapped for the test database. */
export const testEnv: Record<string, string> = {
	...(fileEnv as Record<string, string>),
	NODE_ENV: "test",
	DATABASE_URL: testDatabaseUrl,
};
