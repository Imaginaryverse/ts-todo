import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { useGetHealthQuery } from "../queries/health";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	const { data, isPending, isError } = useGetHealthQuery();

	const healthStatus = useMemo(() => {
		if (isPending) return "Loading...";
		if (isError) return "API is unavailable";
		return `API is ${data.status}`;
	}, [isPending, isError, data]);

	return <p>{healthStatus}</p>;
}
