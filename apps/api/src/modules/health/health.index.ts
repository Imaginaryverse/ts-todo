import { createRouter } from "../../lib/create-router";
import { getHealthHandler } from "./health.handlers";
import { getHealthRoute } from "./health.routes";

export const healthRouter = createRouter().openapi(getHealthRoute, getHealthHandler);
