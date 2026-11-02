import { useQuery } from "@tanstack/react-query";
import { GetHealthResponse } from "@ts-todo/schemas";

import { api } from "../lib/api-client";
import { parseResponseWith } from "../lib/parse-response-with";

export const healthKeys = {
	all: ["health"] as const,
};

export function useGetHealthQuery() {
	return useQuery({
		queryKey: healthKeys.all,
		queryFn: () => parseResponseWith(GetHealthResponse, api.health.$get()),
		// Its whole job is to report what's true right now
		staleTime: 0,
	});
}
