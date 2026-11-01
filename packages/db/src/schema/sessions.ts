import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { id, timestamps } from "./columns";
import { users } from "./users";

export const sessions = pgTable(
	"sessions",
	{
		id,
		token: text("token").notNull(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		...timestamps,
	},
	(table) => [
		uniqueIndex("sessions_token_unique").on(table.token),
		index("sessions_user_id_idx").on(table.userId),
	],
);
