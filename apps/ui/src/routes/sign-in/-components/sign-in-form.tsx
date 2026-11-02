import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { z } from "zod";

import { FieldError } from "../../../components/field-error";
import { useSignInMutation } from "../../../queries/session";

// Better Auth owns this endpoint, so there's no shared contract for it in @ts-todo/schemas
const SignInInput = z.object({
	email: z.email({ error: "Enter a valid email address" }),
	password: z.string().min(1, { error: "Enter your password" }),
});

export function SignInForm({ redirectTo }: { redirectTo: string | undefined }) {
	const router = useRouter();
	const signIn = useSignInMutation();

	const form = useForm({
		defaultValues: { email: "", password: "" },
		validators: { onChange: SignInInput },
		onSubmit: ({ value }) => {
			signIn.mutate(value, {
				onSuccess: () => router.history.push(redirectTo ?? "/"),
			});
		},
	});

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<Flex direction="column" gap="3" maxWidth="480px">
				<form.Field name="email">
					{(field) => (
						<Text as="label" size="2" weight="medium">
							Email
							<TextField.Root
								type="email"
								autoComplete="email"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
							/>
							<FieldError field={field} />
						</Text>
					)}
				</form.Field>
				<form.Field name="password">
					{(field) => (
						<Text as="label" size="2" weight="medium">
							Password
							<TextField.Root
								type="password"
								autoComplete="current-password"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
							/>
							<FieldError field={field} />
						</Text>
					)}
				</form.Field>
				{signIn.error && (
					<Text role="alert" size="2" color="red">
						{signIn.error.message}
					</Text>
				)}
				<Button type="submit" loading={signIn.isPending}>
					Sign in
				</Button>
			</Flex>
		</form>
	);
}
