import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { id, timestamps } from "./columns";

export const users = pgTable(
	"users",
	{
		id,
		email: text("email").notNull(),
		name: text("name").notNull(),
		emailVerified: boolean("email_verified").notNull().default(false),
		image: text("image"),
		...timestamps,
	},
	(table) => [
		uniqueIndex("users_email_unique").on(table.email),
		// Emails are normalized before insert; this keeps the unique index case-insensitive
		check("users_email_lowercase", sql`${table.email} = lower(${table.email})`),
	],
);
