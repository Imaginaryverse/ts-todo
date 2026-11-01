import type { NotFoundHandler } from "hono";

import type { AppEnv } from "../types";
import { AppError } from "./errors";

export const notFoundHandler: NotFoundHandler<AppEnv> = (c) => {
	const err = new AppError("NOT_FOUND", `Route ${c.req.method} ${c.req.path} not found`);
	return c.json(err.toBody(), err.status);
};
