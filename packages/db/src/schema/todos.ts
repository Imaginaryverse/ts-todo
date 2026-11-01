import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const todos = pgTable(
	"todos",
	{
		id: uuid("id")
			.primaryKey()
			.default(sql`uuidv7()`),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		description: text("description"),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		// Serves "this user's todos, newest first"; also covers lookups by user_id alone
		index("todos_user_id_created_at_idx").on(table.userId, table.createdAt),
		check("todos_title_not_blank", sql`length(trim(${table.title})) > 0`),
	],
);
