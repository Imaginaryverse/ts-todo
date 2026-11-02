import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { NewTodoForm } from "./new-todo-form";

function renderForm(onCreate = vi.fn().mockResolvedValue(true)) {
	return {
		onCreate,
		rendered: render(<NewTodoForm onCreate={onCreate} errorMessage={undefined} />),
	};
}

test("doesn't submit a title with only spaces", async () => {
	const { onCreate, rendered } = renderForm();
	const screen = await rendered;

	await screen.getByLabelText("Title").fill("   ");
	await screen.getByRole("button", { name: "Add todo" }).click();

	await expect.element(screen.getByRole("alert")).toHaveTextContent("Enter a title");
	expect(onCreate).not.toHaveBeenCalled();
});

test("waits until the user leaves a field before showing its error", async () => {
	const { rendered } = renderForm();
	const screen = await rendered;
	const title = screen.getByLabelText("Title");

	await title.fill("x".repeat(101));
	await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();

	await screen.getByLabelText("Description").click();
	await expect.element(screen.getByRole("alert")).toHaveTextContent("Use at most 100 characters");
});

test("clears a field's error as soon as it's fixed", async () => {
	const { rendered } = renderForm();
	const screen = await rendered;
	// The error sits inside the label, so it's part of the field's name while it's showing
	const title = screen.getByLabelText(/^Title/);

	await title.fill("x".repeat(101));
	await screen.getByLabelText("Description").click();
	await expect.element(screen.getByRole("alert")).toBeVisible();

	await title.fill("Short enough");
	await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
});

test("shows errors when submitting with Enter, without leaving the field", async () => {
	const { onCreate, rendered } = renderForm();
	const screen = await rendered;

	await screen.getByLabelText("Title").fill("x".repeat(101));
	await userEvent.keyboard("{Enter}");

	await expect.element(screen.getByRole("alert")).toHaveTextContent("Use at most 100 characters");
	expect(onCreate).not.toHaveBeenCalled();
});

test("submits the shared schema's parsed output and clears the form", async () => {
	const { onCreate, rendered } = renderForm();
	const screen = await rendered;

	await screen.getByLabelText("Title").fill("  Buy milk  ");
	await screen.getByRole("button", { name: "Add todo" }).click();

	await expect.poll(() => onCreate.mock.calls.length).toBe(1);
	expect(onCreate).toHaveBeenCalledWith({ title: "Buy milk" });
	await expect.element(screen.getByLabelText("Title")).toHaveValue("");
});

test("keeps what the user typed when creating fails", async () => {
	const { onCreate, rendered } = renderForm(vi.fn().mockResolvedValue(false));
	const screen = await rendered;

	await screen.getByLabelText("Title").fill("Buy milk");
	await screen.getByRole("button", { name: "Add todo" }).click();

	await expect.poll(() => onCreate.mock.calls.length).toBe(1);
	await expect.element(screen.getByLabelText("Title")).toHaveValue("Buy milk");
});

test("shows the error it's given", async () => {
	const screen = await render(<NewTodoForm onCreate={vi.fn()} errorMessage="Couldn't add it" />);

	await expect.element(screen.getByRole("alert")).toHaveTextContent("Couldn't add it");
});
