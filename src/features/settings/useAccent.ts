"use client";

// Hooks that read the active accent (key and resolved hex) from the document,
// keeping React state in sync with the Appearance settings via a MutationObserver.

import { useEffect, useState } from "react";
import type { Accent } from "@/types";

// Accent keys valid for the document `data-accent` attribute.
const ACCENTS: Accent[] = ["gold", "indigo", "crimson", "charcoal"];

// Reads the current accent key from the document's data-accent attribute.
function readAccentKey(): Accent {
  if (typeof document === "undefined") return "indigo";
  const value = document.documentElement.dataset.accent;
  return (ACCENTS.includes(value as Accent) ? value : "indigo") as Accent;
}

// Reads the resolved accent hex from the --app-accent CSS variable.
function readAccentHex(): string {
  if (typeof window === "undefined") return "#2F6798";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--app-accent")
    .trim();
  return value || "#2F6798";
}

/**
 * Returns the currently selected accent key, kept in sync with the
 * `data-accent` attribute that the Appearance settings write.
 */
export function useAccent(): Accent {
  // Holds the live accent key, kept in sync with the document attribute.
  const [accent, setAccent] = useState<Accent>("indigo");

  useEffect(() => {
    setAccent(readAccentKey());
    const observer = new MutationObserver(() => setAccent(readAccentKey()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-accent"],
    });
    return () => observer.disconnect();
  }, []);

  return accent;
}

/**
 * Returns the resolved accent color (respecting light/dark overrides) sourced
 * from the `--app-accent` CSS variable set by the Appearance settings.
 */
export function useAccentHex(): string {
  // Holds the live resolved accent hex, kept in sync with CSS variables.
  const [hex, setHex] = useState<string>("#2F6798");

  useEffect(() => {
    setHex(readAccentHex());
    const observer = new MutationObserver(() => setHex(readAccentHex()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-accent", "class"],
    });
    return () => observer.disconnect();
  }, []);

  return hex;
}
