import type { AppType } from "@ts-todo/api/app";
import { hc } from "hono/client";

import { env } from "../env";

export const api = hc<AppType>(env.VITE_API_URL, {
	init: { credentials: "include" },
});
