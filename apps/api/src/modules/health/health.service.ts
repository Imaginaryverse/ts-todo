import { sql } from "drizzle-orm";

import { db } from "../../db";

export async function isDatabaseReachable(): Promise<boolean> {
	try {
		await db.execute(sql`select 1`);
		return true;
	} catch (error) {
		console.error("Health check failed:", error instanceof Error ? error.message : error);
		return false;
	}
}
