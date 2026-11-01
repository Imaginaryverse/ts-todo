import { z } from "zod";

const EnvSchema = z.object({
	VITE_API_URL: z.url({ protocol: /^https?$/ }),
});

export const env = EnvSchema.parse(import.meta.env);
