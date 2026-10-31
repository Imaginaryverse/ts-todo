import { defineConfig } from "oxlint";

export default defineConfig({
	categories: {
		correctness: "error",
		suspicious: "warn",
		pedantic: "off",
	},
	overrides: [
		{
			// Code that runs in the browser, or that the browser imports, must not pull in the database layer
			files: ["packages/schemas/**", "apps/ui/src/**"],
			rules: {
				"no-restricted-imports": [
					"error",
					{
						patterns: [
							{
								group: ["@ts-todo/db", "@ts-todo/db/*", "drizzle-orm", "drizzle-orm/*"],
								message:
									"The database layer is server-only. Shared contracts are plain Zod; the API maps rows to them.",
							},
						],
					},
				],
			},
		},
	],
});
