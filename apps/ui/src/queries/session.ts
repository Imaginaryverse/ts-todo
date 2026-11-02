import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authClient } from "../lib/auth-client";

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
		onSuccess: () => queryClient.fetchQuery(sessionQueryOptions),
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
		onSuccess: () => queryClient.fetchQuery(sessionQueryOptions),
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
		onSuccess: () => {
			// Drop everything the user could see. The session query stays, set to null, because
			// `queryClient.clear()` would leave mounted components showing the old user.
			queryClient.removeQueries({
				predicate: (query) => query.queryKey[0] !== sessionKeys.all[0],
			});
			queryClient.setQueryData(sessionQueryOptions.queryKey, null);
		},
	});
}
