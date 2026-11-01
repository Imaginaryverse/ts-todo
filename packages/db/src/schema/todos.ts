import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { id, timestamps } from "./columns";
import { users } from "./users";

export const todos = pgTable(
	"todos",
	{
		id,
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		description: text("description"),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		...timestamps,
	},
	(table) => [
		// Serves "this user's todos, newest first"; also covers lookups by user_id alone
		index("todos_user_id_created_at_idx").on(table.userId, table.createdAt),
		check("todos_title_not_blank", sql`length(trim(${table.title})) > 0`),
	],
);
