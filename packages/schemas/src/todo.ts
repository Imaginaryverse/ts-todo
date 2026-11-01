import { z } from "zod";

// Field rules shared by the response DTO and the input schemas
export const TodoTitle = z.string().trim().min(1).max(100);
export const TodoDescription = z.string().max(10_000);

export const Todo = z.object({
	id: z.uuid(),
	title: TodoTitle,
	description: TodoDescription.nullable(),
	completedAt: z.iso.datetime().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type Todo = z.infer<typeof Todo>;

export const TodoIdParams = z.object({ id: Todo.shape.id });
export type TodoIdParams = z.infer<typeof TodoIdParams>;

export const PostTodoInput = z.object({
	title: TodoTitle,
	description: TodoDescription.optional(),
});
export type PostTodoInput = z.infer<typeof PostTodoInput>;

export const PatchTodoInput = z
	.object({
		title: TodoTitle.optional(),
		// null clears the description
		description: TodoDescription.nullable().optional(),
		// The server sets or clears completedAt; clients don't send timestamps
		completed: z.boolean().optional(),
	})
	// Checks values, not keys: `{ title: undefined }` is as empty as `{}`
	.refine((input) => Object.values(input).some((value) => value !== undefined), {
		error: "Provide at least one field to update",
	});
export type PatchTodoInput = z.infer<typeof PatchTodoInput>;
