"use client";

// Theme context provider managing light/dark/system theme and persistence.
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
} from "react";
import type { Accent } from "@/types";

// Supported theme modes and the context value contract.
type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

// Context holding the active theme and its resolved (light/dark) value.
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Detects the OS-level preferred color scheme.
function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Converts a theme (including "system") into a concrete light/dark value.
function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemTheme();
  return theme;
}

// Provides theme state and applies the resolved theme to the document root.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Theme state plus mount flags used to defer DOM writes until mounted.
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const mountedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  // On mount: read the persisted theme, initialize state, and mark mounted.
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial = stored ?? "system";
    mountedRef.current = true;
    setThemeState(initial); // eslint-disable-line react-hooks/set-state-in-effect -- Standard hydration pattern
    setResolvedTheme(resolveTheme(initial)); // Sync resolved theme on mount
    setMounted(true);
  }, []);

  // useLayoutEffect runs before paint: re-applies the theme the inline script
  // in the root layout set (and restores it after dev StrictMode remounts).
  useLayoutEffect(() => {
    if (!mounted) return;

    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved); // eslint-disable-line react-hooks/set-state-in-effect -- Derived state sync
    document.documentElement.classList.toggle("dark", resolved === "dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const storedAccent = localStorage.getItem("app-accent") as Accent | null;
    document.documentElement.dataset.accent = storedAccent ?? "indigo";
  }, [mounted]);

  // Public setter that updates the theme state (effect syncs the DOM).
  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to consume theme state; returns a safe default when no provider.
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "system" as Theme,
      setTheme: () => {},
      resolvedTheme: "light" as "light" | "dark",
    };
  }
  return context;
}
