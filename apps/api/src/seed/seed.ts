import { todos, users } from "@ts-todo/db/schema";
import { inArray } from "drizzle-orm";

import { auth } from "../auth";
import { db } from "../db";
import { env } from "../env";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

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

/** Throws unless the URL points at this machine, because the seed creates users with a known password. */
export function assertLocalDatabase(url: string) {
	const { hostname, searchParams } = new URL(url);
	// `pg` lets a `host` query parameter override the host in the URL
	const host = searchParams.get("host") ?? hostname;

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
