import { sendError } from "../../http/errors";
import type { AppRouteHandler } from "../../types";
import type { GetHealthRoute } from "./health.routes";
import { isDatabaseReachable } from "./health.service";

export const getHealthHandler: AppRouteHandler<GetHealthRoute> = async (c) => {
	const isOK = await isDatabaseReachable();

	if (!isOK) {
		return sendError(c, { reason: "SERVICE_UNAVAILABLE", message: "Service unavailable" });
	}

	return c.json({ status: "OK" } as const, 200);
};
