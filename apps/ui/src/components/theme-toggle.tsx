import { SegmentedControl } from "@radix-ui/themes";
import { useTheme } from "next-themes";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<SegmentedControl.Root
			size="1"
			aria-label="Color theme"
			value={theme ?? "system"}
			onValueChange={setTheme}
		>
			<SegmentedControl.Item value="light">Light</SegmentedControl.Item>
			<SegmentedControl.Item value="system">System</SegmentedControl.Item>
			<SegmentedControl.Item value="dark">Dark</SegmentedControl.Item>
		</SegmentedControl.Root>
	);
}
