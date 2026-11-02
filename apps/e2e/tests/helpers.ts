import type { Page } from "@playwright/test";

import { API_URL } from "../src/urls";

export { API_URL };

export const DEMO_PASSWORD = "demo-password";
export const ALICE = { name: "Alice Demo", email: "alice@example.com" };
export const BOB = { name: "Bob Demo", email: "bob@example.com" };

/** Fills in and submits the sign-in form, from whichever page the test is already on. */
export async function submitSignIn(page: Page, email: string, password = DEMO_PASSWORD) {
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Sign in" }).click();
}

export async function signInAs(page: Page, user: { name: string; email: string }) {
	await page.goto("/sign-in");
	await submitSignIn(page, user.email);
	await page.getByText(user.name).waitFor();
}

/** Holds back the list of todos, so a test can look at what's on screen while it's still loading. */
export async function delayTodoList(page: Page, delayMs: number) {
	await page.route(`${API_URL}/todos`, async (route) => {
		if (route.request().method() === "GET") {
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
		await route.continue();
	});
}
