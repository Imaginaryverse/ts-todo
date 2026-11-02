import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	// The router plugin has to run before the React plugin
	plugins: [tanstackRouter({ target: "react" }), react()],
	// Use the repo root's .env, shared with the API. Only VITE_* variables reach the browser.
	envDir: "../..",
	server: {
		port: 5173,
		strictPort: true,
	},
});
