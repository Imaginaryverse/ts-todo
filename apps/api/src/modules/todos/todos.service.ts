import { todos } from "@ts-todo/db/schema";
import type { PatchTodoInput, PostTodoInput } from "@ts-todo/schemas";
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../../db";

// Every query for a single todo filters on this, so users can only reach their own
function isOwnTodo(userId: string, todoId: string) {
	return and(eq(todos.userId, userId), eq(todos.id, todoId));
}

export async function getTodoList(userId: string) {
	const rows = await db
		.select()
		.from(todos)
		.where(eq(todos.userId, userId))
		.orderBy(desc(todos.createdAt));
	return rows;
}

export async function getTodoDetail(userId: string, todoId: string) {
	const [row] = await db.select().from(todos).where(isOwnTodo(userId, todoId));
	return row;
}

export async function createTodo(userId: string, input: PostTodoInput) {
	const [insertedRow] = await db
		.insert(todos)
		.values({
			userId,
			title: input.title,
			// An empty description is stored as null, so "no description" has one representation
			description: input.description || null,
		})
		.returning();

	// An insert either returns its row or throws, so this only happens if the database misbehaves
	if (!insertedRow) {
		throw new Error("Inserting a todo returned no row");
	}

	return insertedRow;
}

// Turns the client's `completed` flag into a value for the completed_at column
function completedAtFor(completed: boolean | undefined) {
	if (completed === undefined) {
		return undefined;
	}
	// Completing an already completed todo keeps its original completion time
	return completed ? sql`coalesce(${todos.completedAt}, now())` : null;
}

export async function updateTodo(userId: string, todoId: string, input: PatchTodoInput) {
	const [updatedRow] = await db
		.update(todos)
		// Fields left undefined are skipped, so only what the client sent changes
		.set({
			title: input.title,
			description: input.description === "" ? null : input.description,
			completedAt: completedAtFor(input.completed),
		})
		.where(isOwnTodo(userId, todoId))
		.returning();
	return updatedRow;
}

export async function deleteTodo(userId: string, todoId: string) {
	const [deletedRow] = await db.delete(todos).where(isOwnTodo(userId, todoId)).returning();
	return deletedRow;
}
