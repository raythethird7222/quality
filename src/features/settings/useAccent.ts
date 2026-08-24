"use client";

import { useEffect, useState } from "react";
import type { Accent } from "@/types";

const ACCENTS: Accent[] = ["gold", "indigo", "crimson", "charcoal"];

function readAccentKey(): Accent {
  if (typeof document === "undefined") return "indigo";
  const value = document.documentElement.dataset.accent;
  return (ACCENTS.includes(value as Accent) ? value : "indigo") as Accent;
}

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
