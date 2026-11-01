import { createDb, migrate } from "@ts-todo/db";
import { sql } from "drizzle-orm";

import { testDatabaseUrl } from "./test-env";

/** Creates the test database if it's missing and applies migrations. Runs once per test run. */
export default async function setup() {
	const url = new URL(testDatabaseUrl);
	const name = url.pathname.slice(1);

	// `CREATE DATABASE` can't run inside the database it creates, so connect to the default one.
	url.pathname = "/postgres";
	const { db, pool } = createDb(url.href);
	try {
		const { rows } = await db.execute<{ datname: string }>(
			sql`select datname from pg_database where datname = ${name}`,
		);
		if (rows.length === 0) {
			// `name` is validated in test-env.ts, so it's safe to use as an identifier.
			await db.execute(sql.raw(`create database "${name}"`));
		}
	} finally {
		await pool.end();
	}

	await migrate(testDatabaseUrl);
}
