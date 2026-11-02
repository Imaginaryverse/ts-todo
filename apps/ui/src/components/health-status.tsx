import { Text } from "@radix-ui/themes";
import { useMemo } from "react";

import { useGetHealthQuery } from "../queries/health";

export function HealthStatus() {
	const { data, isPending, isError } = useGetHealthQuery();

	const healthStatus = useMemo(() => {
		if (isPending) return "Loading...";
		if (isError) return "API is unavailable";
		return `API is ${data.status}`;
	}, [isPending, isError, data]);

	return <Text as="p">{healthStatus}</Text>;
}
