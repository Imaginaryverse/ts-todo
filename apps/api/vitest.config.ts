import { defineConfig } from "vitest/config";

import { testEnv } from "./test/test-env.ts";

export default defineConfig({
	test: {
		name: "api",
		env: testEnv,
		globalSetup: ["./test/global-setup.ts"],
		setupFiles: ["./test/setup.ts"],
		// Test files share one database and truncate it between tests, so they can't run in parallel.
		fileParallelism: false,
	},
});
