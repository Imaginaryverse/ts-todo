import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export function createDb(connectionString: string) {
	const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });

	pool.on("error", (error) => {
		console.error("Unexpected Postgres pool error:", error.message);
	});

	const db = drizzle({ client: pool });

	return { db, pool };
}

export type Db = ReturnType<typeof createDb>["db"];
