// Account and accent configuration: static account registry and accent color map.
import type { AccountLabel, AccountKey, Accent, AccentColors } from "@/types";

// Static registry of supported accounts with their labels, QA names, and accents.
export const ACCOUNTS = {
  js: { label: "JS" as AccountLabel, qaName: "QA CHERYL", accent: "gold" as Accent },
  dft: { label: "DFT" as AccountLabel, qaName: "QA DIANA", accent: "indigo" as Accent },
  rm: { label: "RM" as AccountLabel, qaName: "QA RANDY", accent: "indigo" as Accent },
  bf: { label: "BF" as AccountLabel, qaName: "QA BRIAN", accent: "charcoal" as Accent },
  flexar: { label: "FLEXAR" as AccountLabel, qaName: "QA FLEXAR", accent: "indigo" as Accent },
  spa: { label: "SPA" as AccountLabel, qaName: "QA SPA", accent: "gold" as Accent },
  cova: { label: "COVA" as AccountLabel, qaName: "QA COVA", accent: "charcoal" as Accent },
  fleet: { label: "FLEET" as AccountLabel, qaName: "QA FLEET", accent: "charcoal" as Accent },
} as const;

// Resolve an account by key, falling back to the default (rm) account.
export function getAccount(key: string) {
  return ACCOUNTS[(key as AccountKey)] ?? ACCOUNTS.rm;
}

// Type guard confirming a string is a valid account key.
export function isValidAccount(key: string): key is AccountKey {
  return key in ACCOUNTS;
}

// Maps each accent to its full set of Tailwind color utility classes and hex.
export const ACCENT_COLORS: Record<Accent, AccentColors> = {
  gold: {
    text: "text-brand-gold",
    bg: "bg-brand-gold",
    border: "border-brand-gold",
    hoverBg: "hover:bg-brand-gold/10",
    bgLight: "bg-brand-gold/10",
    hex: "#C8A54B",
  },
  indigo: {
    text: "text-brand-indigo",
    bg: "bg-brand-indigo",
    border: "border-brand-indigo",
    hoverBg: "hover:bg-brand-indigo/10",
    bgLight: "bg-brand-indigo/10",
    hex: "#2F6798",
  },
  crimson: {
    text: "text-brand-crimson",
    bg: "bg-brand-crimson",
    border: "border-brand-crimson",
    hoverBg: "hover:bg-brand-crimson/10",
    bgLight: "bg-brand-crimson/10",
    hex: "#ED1C25",
  },
  charcoal: {
    text: "text-brand-charcoal",
    bg: "bg-brand-charcoal",
    border: "border-brand-charcoal",
    hoverBg: "hover:bg-brand-charcoal/10",
    bgLight: "bg-brand-charcoal/10",
    hex: "#363435",
  },
} as const;

// Look up the color classes for a given accent.
export function getAccentColors(accent: Accent): AccentColors {
  return ACCENT_COLORS[accent];
}

// Derived type for a single account's config entry.
export type AccountConfig = (typeof ACCOUNTS)[AccountKey];
