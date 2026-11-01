import { pool } from "../db";
import { DEMO_PASSWORD, DEMO_USERS, seed } from "./seed";

try {
	await seed();

	console.log("Seeded the database. Sign in with either of these:");
	for (const { email } of DEMO_USERS) {
		console.log(`  ${email} / ${DEMO_PASSWORD}`);
	}
} finally {
	await pool.end();
}
