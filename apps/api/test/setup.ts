import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach } from "vitest";

import { db, pool } from "../src/db";

let tables: string[] = [];

beforeAll(async () => {
	// Last line of defense: never truncate anything but a test database.
	const { rows } = await db.execute<{ name: string }>(sql`select current_database() as name`);
	const name = rows[0]?.name ?? "";
	if (!name.endsWith("_test")) {
		throw new Error(`Refusing to run tests against database "${name}".`);
	}

	const result = await db.execute<{ tablename: string }>(
		sql`select tablename from pg_tables where schemaname = 'public'`,
	);
	tables = result.rows.map((row) => `"${row.tablename}"`);
});

beforeEach(async () => {
	if (tables.length > 0) {
		await db.execute(sql.raw(`truncate table ${tables.join(", ")} restart identity cascade`));
	}
});

afterAll(async () => {
	await pool.end();
});
