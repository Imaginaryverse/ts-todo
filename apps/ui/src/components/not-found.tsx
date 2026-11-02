import { Link } from "@tanstack/react-router";

export function NotFound() {
	return (
		<div>
			<p>Page not found.</p>
			<Link to="/">Go to the home page</Link>
		</div>
	);
}
