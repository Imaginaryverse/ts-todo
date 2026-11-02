import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.css";

import { queryClient, router } from "./router";

const root = document.getElementById("root");

if (!root) {
	throw new Error("index.html is missing the #root element");
}

createRoot(root).render(
	<StrictMode>
		{/*
			Despite its name, next-themes isn't tied to Next. Radix picks up the class it sets. Its inline
			script only runs in server-rendered HTML, so mark it as data to stop React warning about it.
		*/}
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			scriptProps={{ type: "application/json" }}
		>
			<Theme>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</Theme>
		</ThemeProvider>
	</StrictMode>,
);
