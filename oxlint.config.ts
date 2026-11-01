import { defineConfig } from "oxlint";

export default defineConfig({
	categories: {
		correctness: "error",
		suspicious: "warn",
		pedantic: "off",
	},
	rules: {
		// With `verbatimModuleSyntax`, `import { type X }` still loads the module; `import type` doesn't
		"typescript/no-import-type-side-effects": "error",
	},
	overrides: [
		{
			// Code that runs in the browser, or that the browser imports, must not pull in server code
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
							{
								group: ["@ts-todo/api", "@ts-todo/api/*"],
								allowTypeImports: true,
								message:
									"Import the API with `import type`; a value import bundles the server into the browser.",
							},
						],
					},
				],
			},
		},
	],
});
