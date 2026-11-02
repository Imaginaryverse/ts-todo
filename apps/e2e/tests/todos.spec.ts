import { expect, type Page, test } from "@playwright/test";

import { ALICE, API_URL, BOB, delayTodoList, signInAs, submitSignIn } from "./helpers";

// The next user's list is held back, so the only todos that could be on screen are cached ones
async function expectOnlyBobsTodos(page: Page) {
	const alicesTodo = page.getByRole("link", { name: "Buy milk", exact: true });
	await delayTodoList(page, 1500);

	await submitSignIn(page, BOB.email);

	await expect(page.getByText(BOB.name)).toBeVisible();
	expect(await alicesTodo.count()).toBe(0);
	await expect(page.getByRole("link", { name: "Water the plants", exact: true })).toBeVisible();
	expect(await alicesTodo.count()).toBe(0);
}

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

test.describe("the next user never sees the previous user's todos", () => {
	test("after signing out", async ({ page }) => {
		await signInAs(page, ALICE);
		await expect(page.getByRole("link", { name: "Buy milk", exact: true })).toBeVisible();

		await page.getByRole("button", { name: "Sign out" }).click();
		await expect(page).toHaveURL(/\/sign-in/);

		await expectOnlyBobsTodos(page);
	});

	test("after the session ends while the app is open", async ({ page, context }) => {
		await signInAs(page, ALICE);
		await expect(page.getByRole("link", { name: "Buy milk", exact: true })).toBeVisible();

		await context.clearCookies();
		await page.getByLabel("Title").fill(`Too late ${Date.now()}`);
		await page.getByRole("button", { name: "Add todo" }).click();
		await expect(page).toHaveURL(/\/sign-in/);

		await expectOnlyBobsTodos(page);
	});
});

test("the health status keeps working after signing out", async ({ page }) => {
	await signInAs(page, ALICE);
	await page.getByRole("button", { name: "Sign out" }).click();
	await expect(page).toHaveURL(/\/sign-in/);
	await expect(page.getByText("API is OK")).toBeVisible();

	await page.route(`${API_URL}/health`, (route) => route.abort());
	await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));

	await expect(page.getByText("API is unavailable")).toBeVisible({ timeout: 15_000 });
});
