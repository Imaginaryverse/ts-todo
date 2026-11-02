import {
	type QueryClient,
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { authClient } from "../lib/auth-client";
import { healthKeys } from "./health";

export const sessionKeys = {
	all: ["session"] as const,
};

// `data` is null when signed out. React Query is the only source of truth for the session, so this
// app doesn't use Better Auth's own `useSession` store.
export const sessionQueryOptions = queryOptions({
	queryKey: sessionKeys.all,
	queryFn: async () => {
		const { data, error } = await authClient.getSession();
		if (error) {
			throw new Error(error.message ?? "Couldn't load the session");
		}
		return data;
	},
});

// Everything else belongs to whoever is signed in, so it's dropped whenever that can change
const SHARED_QUERY_KEYS: readonly unknown[] = [sessionKeys.all[0], healthKeys.all[0]];

function removeUserQueries(queryClient: QueryClient) {
	queryClient.removeQueries({
		predicate: (query) => !SHARED_QUERY_KEYS.includes(query.queryKey[0]),
	});
}

/**
 * Marks the user as signed out and drops everything they could see. The session query stays, set to
 * null, because `queryClient.clear()` would leave mounted components showing the old user.
 */
export function clearSession(queryClient: QueryClient) {
	removeUserQueries(queryClient);
	queryClient.setQueryData(sessionQueryOptions.queryKey, null);
}

function loadNewSession(queryClient: QueryClient) {
	removeUserQueries(queryClient);
	return queryClient.fetchQuery(sessionQueryOptions);
}

export function useGetSessionQuery() {
	return useQuery(sessionQueryOptions);
}

export function useSignInMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { email: string; password: string }) => {
			const { error } = await authClient.signIn.email(input);
			if (error) {
				throw new Error(error.message ?? "Couldn't sign in");
			}
		},
		onSuccess: () => loadNewSession(queryClient),
	});
}

export function useSignUpMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { name: string; email: string; password: string }) => {
			const { error } = await authClient.signUp.email(input);
			if (error) {
				throw new Error(error.message ?? "Couldn't sign up");
			}
		},
		onSuccess: () => loadNewSession(queryClient),
	});
}

export function useSignOutMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const { error } = await authClient.signOut();
			if (error) {
				throw new Error(error.message ?? "Couldn't sign out");
			}
		},
		onSuccess: () => clearSession(queryClient),
	});
}
