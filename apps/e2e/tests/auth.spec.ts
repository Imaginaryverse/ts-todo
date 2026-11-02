import { expect, test } from "@playwright/test";

import { ALICE, DEMO_PASSWORD, signInAs, submitSignIn } from "./helpers";

test("sends a signed-out visitor to sign-in, and back afterwards", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveURL(/\/sign-in\?redirect=/);

	await submitSignIn(page, ALICE.email);

	await expect(page).toHaveURL("/");
	await expect(page.getByText(ALICE.name)).toBeVisible();
});

test("ignores a redirect to another site", async ({ page }) => {
	await page.goto("/sign-in?redirect=//evil.example");

	await submitSignIn(page, ALICE.email);

	await expect(page.getByText(ALICE.name)).toBeVisible();
	await expect(page).toHaveURL("/");
});

test("shows an error for a wrong password", async ({ page }) => {
	await page.goto("/sign-in");

	await submitSignIn(page, ALICE.email, "not-the-password");

	await expect(page.getByRole("alert")).toContainText(/invalid email or password/i);
	await expect(page).toHaveURL(/\/sign-in/);
});

test("signs up a new user", async ({ page }) => {
	const email = `new-user-${Date.now()}@example.com`;
	await page.goto("/sign-up");

	await page.getByLabel("Name").fill("New User");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(DEMO_PASSWORD);
	await page.getByRole("button", { name: "Sign up" }).click();

	await expect(page).toHaveURL("/");
	await expect(page.getByText("New User")).toBeVisible();
});

test("signing out protects the app again", async ({ page }) => {
	await signInAs(page, ALICE);

	await page.getByRole("button", { name: "Sign out" }).click();

	await expect(page).toHaveURL(/\/sign-in/);
	await expect(page.getByText(ALICE.name)).toBeHidden();

	await page.goto("/");
	await expect(page).toHaveURL(/\/sign-in/);
});

test("a signed-in user can't open the sign-in page", async ({ page }) => {
	await signInAs(page, ALICE);

	await page.goto("/sign-in");

	await expect(page).toHaveURL("/");
});

test("a visit without a session cookie goes to sign-in", async ({ page, context }) => {
	await signInAs(page, ALICE);

	await context.clearCookies();
	await page.goto("/");

	await expect(page).toHaveURL(/\/sign-in/);
});

test("sign-up returns to where the visitor came from", async ({ page }) => {
	await page.goto("/sign-up?redirect=/some-page");

	await page.getByLabel("Name").fill("Returning User");
	await page.getByLabel("Email").fill(`returning-${Date.now()}@example.com`);
	await page.getByLabel("Password").fill(DEMO_PASSWORD);
	await page.getByRole("button", { name: "Sign up" }).click();

	await expect(page).toHaveURL("/some-page");
});

test("a signed-in user can't open the sign-up page", async ({ page }) => {
	await signInAs(page, ALICE);

	await page.goto("/sign-up");

	await expect(page).toHaveURL("/");
});

test("sign-up rejects a short password", async ({ page }) => {
	await page.goto("/sign-up");

	await page.getByLabel("Name").fill("Short Password");
	await page.getByLabel("Email").fill(`short-${Date.now()}@example.com`);
	await page.getByLabel("Password").fill("short");
	await page.getByRole("button", { name: "Sign up" }).click();

	await expect(page.getByRole("alert")).toHaveText("Use at least 8 characters");
	await expect(page).toHaveURL(/\/sign-up/);
});

test("sign-up rejects an email that's already taken", async ({ page }) => {
	await page.goto("/sign-up");

	await page.getByLabel("Name").fill("Another Alice");
	await page.getByLabel("Email").fill(ALICE.email);
	await page.getByLabel("Password").fill(DEMO_PASSWORD);
	await page.getByRole("button", { name: "Sign up" }).click();

	await expect(page.getByRole("alert")).toBeVisible();
	await expect(page).toHaveURL(/\/sign-up/);
});
