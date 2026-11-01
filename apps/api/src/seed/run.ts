import { pool } from "../db";
import { DEMO_PASSWORD, DEMO_USERS, describeSeedFailure, seed } from "./seed";

try {
	await seed();

	console.log("Seeded the database. Sign in with either of these:");
	for (const { email } of DEMO_USERS) {
		console.log(`  ${email} / ${DEMO_PASSWORD}`);
	}
} catch (error) {
	console.error(`Couldn't seed the database: ${describeSeedFailure(error)}`);
	process.exitCode = 1;
} finally {
	await pool.end();
}
