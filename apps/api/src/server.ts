import { serve } from "@hono/node-server";

import app from "./app";
import { pool } from "./db";
import { env } from "./env";

const server = serve({ fetch: app.fetch, port: env.PORT }, () => {
	console.log(`🚀 Running on port: ${env.PORT}`);
});

// Stop accepting requests, let in-flight ones finish, then close the database connections.
function shutdown() {
	server.close(async () => {
		await pool.end();
		process.exit(0);
	});
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
