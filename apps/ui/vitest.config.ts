import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	// Discovering these mid-test makes Vite reload the page, which fails tests on a fresh install
	optimizeDeps: { include: ["@radix-ui/themes", "@tanstack/react-form", "hono/client", "zod"] },
	test: {
		name: "ui",
		include: ["src/**/*.test.{ts,tsx}"],
		browser: {
			enabled: true,
			headless: true,
			provider: playwright(),
			instances: [{ browser: "chromium" }],
		},
	},
});
