// Small shared utilities: className merging and display-name formatting.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges class names with clsx and resolves conflicting Tailwind utilities.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Converts a kebab-case slug into a human-readable display name.
export function slugToDisplayName(slug: string): string {
  return slug
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
