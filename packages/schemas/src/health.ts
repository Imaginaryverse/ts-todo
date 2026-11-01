import { z } from "zod";

export const GetHealthResponse = z.object({
	status: z.literal("OK"),
});
export type GetHealthResponse = z.infer<typeof GetHealthResponse>;
