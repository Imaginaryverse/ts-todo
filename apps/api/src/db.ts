import { createDb } from "@ts-todo/db";

import { env } from "./env";

export const { db, pool } = createDb(env.DATABASE_URL);
