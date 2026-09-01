// Small shared utilities: className merging and display-name formatting.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges class names with clsx and resolves conflicting Tailwind utilities.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Converts a URL slug into a human-readable display name.
// Handles percent-encoded characters (e.g. %C3%B1 -> ñ) and kebab-case spacing.
export function slugToDisplayName(slug: string): string {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // Leave as-is if the slug isn't valid percent-encoding.
  }
  return decoded
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Derives up-to-two-letter uppercase initials from a full name.
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
