import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

import { api } from "../lib/api-client";

export const healthKeys = {
	all: ["health"] as const,
};

export function useGetHealthQuery() {
	return useQuery({
		queryKey: healthKeys.all,
		queryFn: () => parseResponse(api.health.$get()),
	});
}
