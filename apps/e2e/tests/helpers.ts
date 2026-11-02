import type { Page } from "@playwright/test";

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
