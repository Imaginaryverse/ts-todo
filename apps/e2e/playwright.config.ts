import { defineConfig, devices } from "@playwright/test";

import { e2eDatabaseUrl } from "./src/env";
import { API_URL, PORTS, UI_URL } from "./src/urls";

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
				PORT: String(PORTS.api),
				DATABASE_URL: e2eDatabaseUrl,
				APP_ORIGIN: UI_URL,
				BETTER_AUTH_URL: API_URL,
			},
		},
		{
			command: `pnpm --filter @ts-todo/ui dev --port ${PORTS.ui}`,
			url: UI_URL,
			reuseExistingServer: false,
			env: { VITE_API_URL: API_URL },
		},
	],
});
