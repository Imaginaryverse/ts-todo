import { Select } from "@radix-ui/themes";
import { useTheme } from "next-themes";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<Select.Root size="1" defaultValue="system" value={theme ?? "system"} onValueChange={setTheme}>
			<Select.Trigger />
			<Select.Content position="popper">
				<Select.Item value="light">Light</Select.Item>
				<Select.Item value="system">System</Select.Item>
				<Select.Item value="dark">Dark</Select.Item>
			</Select.Content>
		</Select.Root>
	);
}
