import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate as runMigrations } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export function createDb(connectionString: string) {
	const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });

	pool.on("error", (error) => {
		console.error("Unexpected Postgres pool error:", error.message);
	});

	const db = drizzle({ client: pool });

	return { db, pool };
}

/** Applies any pending migrations from this package's `migrations` folder. */
export async function migrate(connectionString: string) {
	const { db, pool } = createDb(connectionString);
	try {
		await runMigrations(db, { migrationsFolder: path.join(import.meta.dirname, "../migrations") });
	} finally {
		await pool.end();
	}
}
