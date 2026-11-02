import type { ErrorComponentProps } from "@tanstack/react-router";

export function ErrorMessage({ error, reset }: ErrorComponentProps) {
	const message = error instanceof Error ? error.message : "Unknown error";

	return (
		<div role="alert">
			<p>Something went wrong: {message}</p>
			<button type="button" onClick={reset}>
				Try again
			</button>
		</div>
	);
}
