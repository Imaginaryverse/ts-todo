import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app";
import { queryClient } from "./lib/query-client";

const root = document.getElementById("root");

if (!root) {
	throw new Error("index.html is missing the #root element");
}

createRoot(root).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
			<ReactQueryDevtools />
		</QueryClientProvider>
	</StrictMode>,
);
