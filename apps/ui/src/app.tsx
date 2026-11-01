import { useMemo } from "react";

import { useGetHealthQuery } from "./queries/health";

export default function App() {
	const { data, isPending, isError } = useGetHealthQuery();

	const healthStatus = useMemo(() => {
		if (isPending) return "Loading...";
		if (isError) return "API is unavailable";
		return `API is ${data.status}`;
	}, [isPending, isError, data]);

	return (
		<div>
			<h1>TS Todo</h1>
			{healthStatus}
		</div>
	);
}
