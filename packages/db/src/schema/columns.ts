import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";

// Columns every table has. Better Auth's tables use them too, so all ids and timestamps look alike.
export const id = uuid("id")
	.primaryKey()
	.default(sql`uuidv7()`);

export const timestamps = {
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
};
