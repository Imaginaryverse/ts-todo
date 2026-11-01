import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { id, timestamps } from "./columns";

export const verifications = pgTable(
	"verifications",
	{
		id,
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		...timestamps,
	},
	(table) => [index("verifications_identifier_idx").on(table.identifier)],
);
