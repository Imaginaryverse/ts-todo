import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	// Use the repo root's .env, shared with the API. Only VITE_* variables reach the browser.
	envDir: "../..",
	server: {
		port: 5173,
		strictPort: true,
	},
});
