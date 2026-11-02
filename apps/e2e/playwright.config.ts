import { defineConfig, devices } from "@playwright/test";

import { e2eDatabaseUrl } from "./src/env";

// Spare ports, so these servers don't clash with `pnpm dev`
const API_PORT = 3100;
const UI_PORT = 5174;
const API_URL = `http://localhost:${API_PORT}`;
const UI_URL = `http://localhost:${UI_PORT}`;

export default defineConfig({
	testDir: "./tests",
	// The tests share the seeded demo accounts
	fullyParallel: false,
	workers: 1,
	use: { baseURL: UI_URL, trace: "retain-on-failure" },
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: [
		{
			command: "pnpm --filter @ts-todo/api dev",
			url: `${API_URL}/health`,
			reuseExistingServer: false,
			env: {
				PORT: String(API_PORT),
				DATABASE_URL: e2eDatabaseUrl,
				APP_ORIGIN: UI_URL,
				BETTER_AUTH_URL: API_URL,
			},
		},
		{
			command: `pnpm --filter @ts-todo/ui dev --port ${UI_PORT}`,
			url: UI_URL,
			reuseExistingServer: false,
			env: { VITE_API_URL: API_URL },
		},
	],
});
