import app from "../src/app";
import { env } from "../src/env";

/** Default credentials for tests. Override individual fields where a test needs to. */
export const TEST_USER = {
	name: "John Doe",
	email: "john@example.com",
	password: "correct-horse-battery",
};

type Credentials = typeof TEST_USER;

// Sends `Origin` like a browser would; Better Auth checks it on requests that carry cookies.
function postAuth(path: string, body: object, cookie?: string) {
	return app.request(`/auth${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Origin: env.APP_ORIGIN,
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify(body),
	});
}

/** Creates a user through Better Auth, as every test that needs a user should. */
export function signUp(overrides: Partial<Credentials> = {}) {
	return postAuth("/sign-up/email", { ...TEST_USER, ...overrides });
}

export function signIn(overrides: Partial<Omit<Credentials, "name">> = {}) {
	const { email, password } = { ...TEST_USER, ...overrides };
	return postAuth("/sign-in/email", { email, password });
}

export function signOut(cookie: string) {
	return postAuth("/sign-out", {}, cookie);
}

/** Turns a response's `Set-Cookie` headers into a `Cookie` header for the next request. */
export function cookieFrom(res: Response) {
	return res.headers
		.getSetCookie()
		.map((cookie) => cookie.split(";")[0])
		.join("; ");
}

/** Signs up `TEST_USER`, or whoever the overrides describe, and returns their session cookie. */
export async function signedInCookie(overrides: Partial<Credentials> = {}) {
	const res = await signUp(overrides);
	if (!res.ok) {
		throw new Error(`Sign-up failed with status ${res.status}`);
	}
	return cookieFrom(res);
}
