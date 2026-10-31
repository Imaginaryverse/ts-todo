import { z } from "zod";

export const User = z.object({
	id: z.uuid(),
	email: z.email(),
	name: z.string(),
	emailVerified: z.boolean(),
	createdAt: z.iso.datetime(),
});
export type User = z.infer<typeof User>;
