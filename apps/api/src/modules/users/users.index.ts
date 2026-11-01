import { createRouter } from "../../lib/create-router";
import { getMeHandler } from "./users.handlers";
import { getMeRoute } from "./users.routes";

export const usersRouter = createRouter().openapi(getMeRoute, getMeHandler);
