import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";

import { NewTodoForm } from "./new-todo-form";

test("doesn't submit a title with only spaces", async () => {
	const onCreate = vi.fn().mockResolvedValue(true);
	const screen = await render(<NewTodoForm onCreate={onCreate} errorMessage={undefined} />);

	await screen.getByLabelText("Title").fill("   ");
	await screen.getByRole("button", { name: "Add todo" }).click();

	await expect.element(screen.getByRole("alert")).toBeVisible();
	expect(onCreate).not.toHaveBeenCalled();
});

test("submits the shared schema's parsed output and clears the form", async () => {
	const onCreate = vi.fn().mockResolvedValue(true);
	const screen = await render(<NewTodoForm onCreate={onCreate} errorMessage={undefined} />);

	await screen.getByLabelText("Title").fill("  Buy milk  ");
	await screen.getByRole("button", { name: "Add todo" }).click();

	await expect.poll(() => onCreate.mock.calls.length).toBe(1);
	expect(onCreate).toHaveBeenCalledWith({ title: "Buy milk" });
	await expect.element(screen.getByLabelText("Title")).toHaveValue("");
});

test("keeps what the user typed when creating fails", async () => {
	const onCreate = vi.fn().mockResolvedValue(false);
	const screen = await render(<NewTodoForm onCreate={onCreate} errorMessage="Couldn't add it" />);

	await screen.getByLabelText("Title").fill("Buy milk");
	await screen.getByRole("button", { name: "Add todo" }).click();

	await expect.poll(() => onCreate.mock.calls.length).toBe(1);
	await expect.element(screen.getByLabelText("Title")).toHaveValue("Buy milk");
	await expect.element(screen.getByText("Couldn't add it")).toBeVisible();
});
