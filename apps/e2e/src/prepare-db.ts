import { execFileSync } from "node:child_process";

import { createDb, migrate } from "@ts-todo/db";
import { sql } from "drizzle-orm";

import { e2eDatabaseUrl } from "./env";

// Runs before Playwright, which starts the API before its own global setup would run. The API's
// readiness check, /health, needs the database to exist already.
const url = new URL(e2eDatabaseUrl);
const name = url.pathname.slice(1);

// `CREATE DATABASE` can't run inside the database it creates, so connect to the default one.
url.pathname = "/postgres";
const { db, pool } = createDb(url.href);
try {
	const { rows } = await db.execute<{ datname: string }>(
		sql`select datname from pg_database where datname = ${name}`,
	);
	if (rows.length === 0) {
		// `name` is validated in env.ts, so it's safe to use as an identifier.
		await db.execute(sql.raw(`create database "${name}"`));
	}
} finally {
	await pool.end();
}

await migrate(e2eDatabaseUrl);

execFileSync("pnpm", ["--filter", "@ts-todo/api", "db:seed"], {
	env: { ...process.env, DATABASE_URL: e2eDatabaseUrl },
	stdio: "inherit",
});
