"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

// Cycles between light, dark, and system themes with an icon button.
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Advances to the next theme in the light → dark → system cycle.
  function toggle() {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }

  // Icon and label maps keyed by the current theme.
  const icons = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const labels = {
    light: "Switch to dark mode",
    dark: "Switch to system mode",
    system: "Switch to light mode",
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-default bg-surface-raised text-text-primary transition-colors hover:bg-surface-overlay"
      aria-label={labels[theme]}
      title={labels[theme]}
    >
      {icons[theme]}
    </button>
  );
}