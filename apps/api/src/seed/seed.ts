import { todos, users } from "@ts-todo/db/schema";
import { inArray } from "drizzle-orm";
import { Client } from "pg";

import { auth } from "../auth";
import { db } from "../db";
import { env } from "../env";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

// Failures people hit during setup, by the error code Postgres or Node gives them
const SETUP_HINTS: Record<string, string> = {
	ECONNREFUSED: "Can't reach Postgres. Is it running? Try `pnpm services:up`.",
	"42P01": "The tables don't exist yet. Try `pnpm db:migrate`.",
};

interface DemoTodo {
	title: string;
	description?: string;
	createdDaysAgo: number;
	completedDaysAgo?: number;
}

export const DEMO_PASSWORD = "demo-password";

// Written by hand to cover the states the UI has to show. Two users, so that switching accounts
// shows that everyone only sees their own todos.
export const DEMO_USERS = [
	{
		name: "Alice Demo",
		email: "alice@example.com",
		todos: [
			{ title: "Buy milk", createdDaysAgo: 0 },
			{
				title: "Prepare the team presentation",
				description:
					"Cover **why** we picked a monorepo:\n\n- One set of types\n- No build step between packages\n- Errors show up where the change breaks something",
				createdDaysAgo: 1,
			},
			{
				title:
					"Plan the summer trips: compare train times, book the cabin, and find someone to water all the plants",
				description: "Book before the end of the month, prices go up after that.",
				createdDaysAgo: 2,
			},
			{ title: "Renew passport", createdDaysAgo: 4, completedDaysAgo: 1 },
			{
				title: "Fix the leaking kitchen tap",
				description: "The washer needs replacing; the spare ones are in the top drawer.",
				createdDaysAgo: 6,
				completedDaysAgo: 3,
			},
			{ title: "Call the dentist", createdDaysAgo: 9, completedDaysAgo: 8 },
		],
	},
	{
		name: "Bob Demo",
		email: "bob@example.com",
		todos: [
			{ title: "Water the plants", createdDaysAgo: 0 },
			{ title: "Return library books", createdDaysAgo: 3, completedDaysAgo: 2 },
		],
	},
] as const satisfies readonly { name: string; email: string; todos: readonly DemoTodo[] }[];

function daysAgo(days: number) {
	return new Date(Date.now() - days * DAY_IN_MS);
}

function toTodoRow(userId: string, todo: DemoTodo): typeof todos.$inferInsert {
	const createdAt = daysAgo(todo.createdDaysAgo);
	const completedAt = todo.completedDaysAgo === undefined ? null : daysAgo(todo.completedDaysAgo);

	return {
		userId,
		title: todo.title,
		description: todo.description ?? null,
		completedAt,
		createdAt,
		updatedAt: completedAt ?? createdAt,
	};
}

/**
 * Throws unless the URL points at this machine, because the seed creates users with a known password.
 * It checks the host and not `NODE_ENV`, which defaults to `development` when it isn't set.
 */
export function assertLocalDatabase(url: string) {
	// Asks `pg` where it would connect, without connecting: parsing the URL here could disagree with it
	const { host } = new Client({ connectionString: url });

	if (!LOCAL_HOSTS.has(host)) {
		throw new Error(
			`Refusing to seed the database on "${host}": only local databases are allowed.`,
		);
	}
}

/**
 * Replaces the demo users and their todos, and leaves everyone else alone. Users are created through
 * Better Auth so that their passwords work; deleting a user cascades to everything they own.
 */
export async function seed() {
	assertLocalDatabase(env.DATABASE_URL);

	await db.delete(users).where(
		inArray(
			users.email,
			DEMO_USERS.map((user) => user.email),
		),
	);

	for (const { name, email, todos: demoTodos } of DEMO_USERS) {
		const { user } = await auth.api.signUpEmail({
			body: { name, email, password: DEMO_PASSWORD },
		});
		await db.insert(todos).values(demoTodos.map((todo) => toTodoRow(user.id, todo)));
	}
}

/** Turns a failed seed into one line for the console, since the error itself can be 40 lines long. */
export function describeSeedFailure(error: unknown) {
	// Drizzle wraps database errors, with the original as the cause
	const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;
	if (!(cause instanceof Error)) {
		return String(cause);
	}

	const code = "code" in cause ? String(cause.code) : "";
	return SETUP_HINTS[code] ?? cause.message;
}
