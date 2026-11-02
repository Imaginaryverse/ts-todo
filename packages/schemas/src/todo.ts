import { z } from "zod";

// Rules for what clients may send. `Todo` deliberately doesn't use them: it describes what's already
// stored, so tightening a rule can't make existing todos invalid.
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 10_000;

const TodoTitle = z
	.string()
	.trim()
	.min(1, { error: "Enter a title" })
	.max(TITLE_MAX_LENGTH, { error: `Use at most ${TITLE_MAX_LENGTH} characters` });
const TodoDescription = z
	.string()
	.max(DESCRIPTION_MAX_LENGTH, { error: `Use at most ${DESCRIPTION_MAX_LENGTH} characters` });

export const Todo = z.object({
	id: z.uuid(),
	title: z.string(),
	description: z.string().nullable(),
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
