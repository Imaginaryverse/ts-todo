import { expect, test } from "@playwright/test";

import { ALICE, BOB, signInAs, submitSignIn } from "./helpers";

test("creates a todo", async ({ page }) => {
	const title = `Created ${Date.now()}`;
	await signInAs(page, ALICE);

	await page.getByLabel("Title").fill(`  ${title}  `);
	await page.getByRole("button", { name: "Add todo" }).click();

	await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();
	await expect(page.getByLabel("Title")).toHaveValue("");
});

test("completes a todo and moves it to the completed group", async ({ page }) => {
	const title = `Completed ${Date.now()}`;
	await signInAs(page, ALICE);
	await page.getByLabel("Title").fill(title);
	await page.getByRole("button", { name: "Add todo" }).click();

	await page.getByRole("checkbox", { name: `Complete ${title}` }).click();

	const completed = page.getByRole("region", { name: "Completed" });
	await expect(completed.getByRole("link", { name: title, exact: true })).toBeVisible();
});

test("edits a todo and clears its description", async ({ page }) => {
	const title = `Edited ${Date.now()}`;
	await signInAs(page, ALICE);
	await page.getByLabel("Title").fill(title);
	await page.getByLabel("Description").fill("First line\nSecond line");
	await page.getByRole("button", { name: "Add todo" }).click();
	await page.getByRole("link", { name: title, exact: true }).click();

	await expect(page.getByLabel("Description")).toHaveValue("First line\nSecond line");

	await page.getByLabel("Title").fill(`${title} renamed`);
	await page.getByLabel("Description").fill("");
	await page.getByRole("button", { name: "Save" }).click();
	await expect(page.getByRole("status")).toHaveText("Saved");

	await page.reload();
	await expect(page.getByLabel("Title")).toHaveValue(`${title} renamed`);
	await expect(page.getByLabel("Description")).toHaveValue("");
});

test("deletes a todo after confirming", async ({ page }) => {
	const title = `Deleted ${Date.now()}`;
	await signInAs(page, ALICE);
	await page.getByLabel("Title").fill(title);
	await page.getByRole("button", { name: "Add todo" }).click();
	await page.getByRole("link", { name: title, exact: true }).click();

	await page.getByRole("button", { name: "Delete" }).click();
	await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();

	await expect(page).toHaveURL("/");
	await expect(page.getByRole("link", { name: title, exact: true })).toBeHidden();
});

test("shows not found for unknown and malformed todo ids", async ({ page }) => {
	await signInAs(page, ALICE);

	await page.goto("/todos/not-a-uuid");
	await expect(page.getByText("Page not found.")).toBeVisible();

	await page.goto("/todos/01900000-0000-7000-8000-000000000000");
	await expect(page.getByText("Page not found.")).toBeVisible();
});

test("returns to a deep link after signing in", async ({ page }) => {
	await signInAs(page, ALICE);
	await page.getByRole("link", { name: "Buy milk", exact: true }).click();
	const url = page.url();
	await page.getByRole("button", { name: "Sign out" }).click();
	await expect(page).toHaveURL(/\/sign-in/);

	await page.goto(url);
	await submitSignIn(page, ALICE.email);

	await expect(page).toHaveURL(url);
});

test("redirects to sign-in when the session ends while the app is open", async ({
	page,
	context,
}) => {
	await signInAs(page, ALICE);

	// No reload: the cached session still says signed in, so only the API's 401 can reveal this
	await context.clearCookies();
	await page.getByLabel("Title").fill(`Too late ${Date.now()}`);
	await page.getByRole("button", { name: "Add todo" }).click();

	await expect(page).toHaveURL(/\/sign-in/);
});

test("each user sees only their own todos", async ({ browser }) => {
	const aliceContext = await browser.newContext();
	const bobContext = await browser.newContext();
	const alice = await aliceContext.newPage();
	const bob = await bobContext.newPage();

	await signInAs(alice, ALICE);
	await signInAs(bob, BOB);

	await expect(alice.getByRole("link", { name: "Buy milk", exact: true })).toBeVisible();
	await expect(alice.getByRole("link", { name: "Water the plants", exact: true })).toBeHidden();
	await expect(bob.getByRole("link", { name: "Water the plants", exact: true })).toBeVisible();
	await expect(bob.getByRole("link", { name: "Buy milk", exact: true })).toBeHidden();

	await aliceContext.close();
	await bobContext.close();
});

test("signing out and in as someone else doesn't show the previous user's todos", async ({
	page,
}) => {
	await signInAs(page, ALICE);
	await expect(page.getByRole("link", { name: "Buy milk", exact: true })).toBeVisible();

	await page.getByRole("button", { name: "Sign out" }).click();
	await expect(page).toHaveURL(/\/sign-in/);
	await submitSignIn(page, BOB.email);

	await expect(page.getByRole("link", { name: "Water the plants", exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Buy milk", exact: true })).toBeHidden();
});
