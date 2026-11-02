import { createFileRoute } from "@tanstack/react-router";

import { HealthStatus } from "../../components/health-status";

export const Route = createFileRoute("/_authenticated/")({ component: HomePage });

function HomePage() {
	return <HealthStatus />;
}
