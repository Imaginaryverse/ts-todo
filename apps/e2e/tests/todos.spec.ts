import { expect, type Page, test } from "@playwright/test";

import {
	ALICE,
	API_URL,
	BOB,
	delayTodoList,
	failApiRoute,
	openNewTodoForm,
	signInAs,
	submitSignIn,
} from "./helpers";

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

	await openNewTodoForm(page);
	await page.getByLabel("Title").fill(`  ${title}  `);
	await page.getByRole("button", { name: "Add" }).click();

	await expect(page.getByRole("dialog")).toBeHidden();
	await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();

	await openNewTodoForm(page);
	await expect(page.getByLabel("Title")).toHaveValue("");
});

test("completes a todo and moves it to the completed group", async ({ page }) => {
	const title = `Completed ${Date.now()}`;
	await signInAs(page, ALICE);
	await openNewTodoForm(page);
	await page.getByLabel("Title").fill(title);
	await page.getByRole("button", { name: "Add" }).click();

	await page.getByRole("checkbox", { name: `Complete ${title}` }).click();

	const completed = page.getByRole("region", { name: "Completed" });
	await expect(completed.getByRole("link", { name: title, exact: true })).toBeVisible();
});

test("edits a todo and clears its description", async ({ page }) => {
	const title = `Edited ${Date.now()}`;
	await signInAs(page, ALICE);
	await openNewTodoForm(page);
	await page.getByLabel("Title").fill(title);
	await page.getByLabel("Description").fill("First line\nSecond line");
	await page.getByRole("button", { name: "Add" }).click();
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
	await openNewTodoForm(page);
	await page.getByLabel("Title").fill(title);
	await page.getByRole("button", { name: "Add" }).click();
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
	await openNewTodoForm(page);
	await page.getByLabel("Title").fill(`Too late ${Date.now()}`);
	await page.getByRole("button", { name: "Add" }).click();

	await expect(page).toHaveURL(/\/sign-in/);
});

test("keeps the header and footer at the edges of the window, whatever the page's length", async ({
	page,
}) => {
	await signInAs(page, ALICE);
	const header = page.getByRole("banner");
	// The router's devtools render a footer of their own
	const footer = page.getByRole("contentinfo").filter({ hasText: "API is" });

	async function expectAtEdges(windowHeight: number) {
		const headerBox = await header.boundingBox();
		const footerBox = await footer.boundingBox();
		expect(headerBox?.y).toBe(0);
		expect((footerBox?.y ?? 0) + (footerBox?.height ?? 0)).toBe(windowHeight);
	}

	await page.setViewportSize({ width: 1280, height: 2000 });
	await expectAtEdges(2000);

	await page.setViewportSize({ width: 1280, height: 400 });
	await page.evaluate(() => window.scrollTo(0, 100));
	await expectAtEdges(400);
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
		await openNewTodoForm(page);
		await page.getByLabel("Title").fill(`Too late ${Date.now()}`);
		await page.getByRole("button", { name: "Add" }).click();
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

const TODO_DETAIL_URL = new RegExp(`^${API_URL}/todos/[^/]+$`);

test.describe("when things go wrong", () => {
	test("shows the app and a loading message while the list loads", async ({ page }) => {
		await signInAs(page, ALICE);
		await delayTodoList(page, 2000);

		await page.goto("/");

		await expect(page.getByRole("heading", { name: "TS Todo" })).toBeVisible();
		await expect(page.getByText("Loading...")).toBeVisible();
		await expect(page.getByRole("link", { name: "Buy milk", exact: true })).toBeVisible();
	});

	test("recovers with Try again after the list fails to load", async ({ page }) => {
		await signInAs(page, ALICE);
		await failApiRoute(page, "/todos", "GET");

		await page.goto("/");
		await expect(page.getByText("Something went wrong")).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole("heading", { name: "TS Todo" })).toBeVisible();

		await page.unroute(`${API_URL}/todos`);
		await page.getByRole("button", { name: "Try again" }).click();

		await expect(page.getByRole("link", { name: "Buy milk", exact: true })).toBeVisible();
	});

	test("keeps unsaved edits when refreshing a todo fails", async ({ page }) => {
		await signInAs(page, ALICE);
		await page.getByRole("link", { name: "Call the dentist", exact: true }).click();
		const description = page.getByLabel("Description");
		await description.waitFor();

		let failures = 0;
		await page.route(TODO_DETAIL_URL, (route) => {
			if (route.request().method() !== "GET") {
				return route.fallback();
			}
			failures++;
			return route.abort();
		});
		await page.getByLabel("Title").fill("Call the dentist");
		await page.getByRole("button", { name: "Save" }).click();
		await description.fill("A draft worth keeping");

		// The save invalidates the todo, and its refetch fails every retry
		await expect.poll(() => failures, { timeout: 15_000 }).toBe(4);
		await expect(page.getByRole("alert")).toContainText("may be out of date");

		await expect(description).toHaveValue("A draft worth keeping");
	});

	test("shows not found when a todo is deleted elsewhere", async ({ page }) => {
		const title = `Deleted elsewhere ${Date.now()}`;
		await signInAs(page, ALICE);
		await openNewTodoForm(page);
		await page.getByLabel("Title").fill(title);
		await page.getByRole("button", { name: "Add" }).click();
		await page.getByRole("link", { name: title, exact: true }).click();
		await page.getByLabel("Description").waitFor();
		await page.waitForLoadState("networkidle");

		await failApiRoute(page, TODO_DETAIL_URL, "GET", { status: 404, message: "Not found" });
		await page.getByRole("button", { name: "Save" }).click();

		await expect(page.getByText("Page not found.")).toBeVisible();
	});

	test("says so when completing a todo fails", async ({ page }) => {
		const title = `Won't complete ${Date.now()}`;
		await signInAs(page, ALICE);
		await openNewTodoForm(page);
		await page.getByLabel("Title").fill(title);
		await page.getByRole("button", { name: "Add" }).click();
		const checkbox = page.getByRole("checkbox", { name: `Complete ${title}` });
		await checkbox.waitFor();

		await failApiRoute(page, TODO_DETAIL_URL, "PATCH", { message: "Couldn't save that" });
		await checkbox.click();

		await expect(page.getByRole("alert")).toContainText("Couldn't save that");
		await expect(checkbox).not.toBeChecked();
	});

	test("says so when signing out fails", async ({ page }) => {
		await signInAs(page, ALICE);
		await page.route(`${API_URL}/auth/sign-out`, (route) =>
			route.fulfill({
				status: 500,
				contentType: "application/json",
				headers: {
					"access-control-allow-origin": new URL(page.url()).origin,
					"access-control-allow-credentials": "true",
				},
				body: JSON.stringify({ code: "FAILED", message: "Couldn't sign you out" }),
			}),
		);

		await page.getByRole("button", { name: "Sign out" }).click();

		await expect(page.getByRole("alert")).toContainText("Couldn't sign you out");
		await expect(page.getByText(ALICE.name)).toBeVisible();
	});

	test("shows the API's message and keeps what was typed when creating fails", async ({ page }) => {
		await signInAs(page, ALICE);
		await failApiRoute(page, "/todos", "POST", { status: 422, message: "Title is taken" });

		await openNewTodoForm(page);
		await page.getByLabel("Title").fill("A taken title");
		await page.getByRole("button", { name: "Add" }).click();

		await expect(page.getByRole("alert")).toHaveText("Title is taken");
		await expect(page.getByLabel("Title")).toHaveValue("A taken title");

		await page.keyboard.press("Escape");
		await openNewTodoForm(page);
		await expect(page.getByRole("alert")).toBeHidden();
	});
});

test("going back through history shows each todo's own values", async ({ page }) => {
	await signInAs(page, ALICE);
	await page.getByRole("link", { name: "Renew passport", exact: true }).click();
	await expect(page.getByLabel("Title")).toHaveValue("Renew passport");
	await page.getByRole("link", { name: "Back to your todos" }).click();
	await page.getByRole("link", { name: "Fix the leaking kitchen tap", exact: true }).click();
	await expect(page.getByLabel("Title")).toHaveValue("Fix the leaking kitchen tap");

	await page.getByLabel("Title").fill("Typed for the other todo");
	await page.evaluate(() => history.go(-2));

	await expect(page.getByLabel("Title")).toHaveValue("Renew passport");
});

test("the saved message goes away after further edits, and the title shows what was saved", async ({
	page,
}) => {
	const title = `Saved ${Date.now()}`;
	await signInAs(page, ALICE);
	await openNewTodoForm(page);
	await page.getByLabel("Title").fill(title);
	await page.getByRole("button", { name: "Add" }).click();
	await page.getByRole("link", { name: title, exact: true }).click();

	await page.getByLabel("Title").fill(`  ${title}  `);
	await page.getByRole("button", { name: "Save" }).click();

	await expect(page.getByRole("status")).toHaveText("Saved");
	await expect(page.getByLabel("Title")).toHaveValue(title);

	await page.getByLabel("Description").fill("One more thing");
	await expect(page.getByRole("status")).toBeHidden();
});

test("opening a page doesn't fetch the same data twice", async ({ page }) => {
	await signInAs(page, ALICE);
	await page.goto("/sign-in");
	await page.waitForURL("/");
	await page.waitForLoadState("networkidle");

	let requests = 0;
	page.on("request", (request) => {
		if (request.method() === "GET" && TODO_DETAIL_URL.test(request.url())) {
			requests++;
		}
	});
	await page.getByRole("link", { name: "Buy milk", exact: true }).click();
	await page.getByLabel("Title").waitFor();
	await page.waitForLoadState("networkidle");

	expect(requests).toBe(1);
});

test("reopens a completed todo", async ({ page }) => {
	const title = `Reopened ${Date.now()}`;
	await signInAs(page, ALICE);
	await openNewTodoForm(page);
	await page.getByLabel("Title").fill(title);
	await page.getByRole("button", { name: "Add" }).click();
	await page.getByRole("checkbox", { name: `Complete ${title}` }).click();

	await page.getByRole("checkbox", { name: `Reopen ${title}` }).click();

	const active = page.getByRole("region", { name: "Active" });
	await expect(active.getByRole("link", { name: title, exact: true })).toBeVisible();
});

test("shows an empty state to a user with no todos", async ({ page }) => {
	await page.goto("/sign-up");
	await page.getByLabel("Name").fill("Empty User");
	await page.getByLabel("Email").fill(`empty-${Date.now()}@example.com`);
	await page.getByLabel("Password").fill("demo-password");
	await page.getByRole("button", { name: "Sign up" }).click();

	await expect(page.getByRole("region", { name: "Active" })).toContainText("Nothing here yet.");
});

test("another user's todo can't be opened by its URL", async ({ browser }) => {
	const bobContext = await browser.newContext();
	const bob = await bobContext.newPage();
	await signInAs(bob, BOB);
	await bob.getByRole("link", { name: "Water the plants", exact: true }).click();
	await bob.getByLabel("Title").waitFor();
	const bobsTodoUrl = bob.url();
	await bobContext.close();

	const aliceContext = await browser.newContext();
	const alice = await aliceContext.newPage();
	await signInAs(alice, ALICE);
	await alice.goto(bobsTodoUrl);

	await expect(alice.getByText("Page not found.")).toBeVisible();
	await aliceContext.close();
});

test("redirects to sign-in when a page's data comes back unauthorized", async ({
	page,
	context,
}) => {
	await signInAs(page, ALICE);
	await context.clearCookies();

	await page.getByRole("link", { name: "Buy milk", exact: true }).click();

	await expect(page).toHaveURL(/\/sign-in\?redirect=/);
});
