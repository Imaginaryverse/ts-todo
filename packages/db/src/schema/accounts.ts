import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { id, timestamps } from "./columns";
import { users } from "./users";

export const accounts = pgTable(
	"accounts",
	{
		id,
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		providerId: text("provider_id").notNull(),
		accountId: text("account_id").notNull(),
		password: text("password"),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
		scope: text("scope"),
		...timestamps,
	},
	(table) => [
		uniqueIndex("accounts_provider_account_unique").on(table.providerId, table.accountId),
		index("accounts_user_id_idx").on(table.userId),
	],
);
