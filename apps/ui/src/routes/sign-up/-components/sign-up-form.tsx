import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { z } from "zod";

import { FieldError } from "../../../components/field-error";
import { useSignUpMutation } from "../../../queries/session";

// Better Auth owns this endpoint, so there's no shared contract for it in @ts-todo/schemas.
// 8 matches Better Auth's default minimum password length, which auth.ts doesn't change.
const SignUpInput = z.object({
	name: z.string().trim().min(1, { error: "Enter your name" }),
	email: z.email({ error: "Enter a valid email address" }),
	password: z.string().min(8, { error: "Use at least 8 characters" }),
});

export function SignUpForm({ redirectTo }: { redirectTo: string | undefined }) {
	const router = useRouter();
	const signUp = useSignUpMutation();

	const form = useForm({
		defaultValues: { name: "", email: "", password: "" },
		validators: { onChange: SignUpInput },
		onSubmit: ({ value }) => {
			// Validators don't apply transforms like `.trim()`, so parse to get the values to send
			signUp.mutate(SignUpInput.parse(value), {
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
			<Flex direction="column" gap="3">
				<form.Field name="name">
					{(field) => (
						<Text as="label" size="2" weight="medium">
							Name
							<TextField.Root
								autoComplete="name"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
							/>
							<FieldError field={field} />
						</Text>
					)}
				</form.Field>
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
								autoComplete="new-password"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
							/>
							<FieldError field={field} />
						</Text>
					)}
				</form.Field>
				{signUp.error && (
					<Text role="alert" size="2" color="red">
						{signUp.error.message}
					</Text>
				)}
				<Button type="submit" loading={signUp.isPending}>
					Sign up
				</Button>
			</Flex>
		</form>
	);
}
