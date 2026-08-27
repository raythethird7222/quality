"use client";

// Hooks that read the active accent (key and resolved hex) and theme design
// from the document, keeping React state in sync with the Appearance settings
// via a MutationObserver-backed external store.

import { useSyncExternalStore } from "react";
import type { Accent } from "@/types";
import {
  isThemeDesignId,
  type ThemeDesignId,
} from "@/features/settings/themeDesigns";

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

// Reads the active theme design id from the document's data-theme-design attribute.
function readThemeDesign(): ThemeDesignId | null {
  if (typeof document === "undefined") return null;
  const value = document.documentElement.dataset.themeDesign;
  return isThemeDesignId(value) ? value : null;
}

// Subscribes a callback to changes on an element's attribute set.
function subscribeAttributes(
  callback: () => void,
  attributeFilter: string[]
): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter });
  return () => observer.disconnect();
}

/**
 * Returns the currently selected accent key, kept in sync with the
 * `data-accent` attribute that the Appearance settings write.
 */
export function useAccent(): Accent {
  return useSyncExternalStore(
    (cb) => subscribeAttributes(cb, ["data-accent"]),
    readAccentKey,
    () => "indigo" as Accent
  );
}

/**
 * Returns the resolved accent color (respecting light/dark overrides) sourced
 * from the `--app-accent` CSS variable set by the Appearance settings.
 */
export function useAccentHex(): string {
  return useSyncExternalStore(
    (cb) => subscribeAttributes(cb, ["data-accent", "class"]),
    readAccentHex,
    () => "#2F6798"
  );
}

/**
 * Returns the active preset theme design id (e.g. "editorial"), kept in sync
 * with the `data-theme-design` attribute that the Appearance settings write.
 * Returns null when no design is applied.
 */
export function useThemeDesign(): ThemeDesignId | null {
  return useSyncExternalStore(
    (cb) => subscribeAttributes(cb, ["data-theme-design"]),
    readThemeDesign,
    () => null
  );
}
