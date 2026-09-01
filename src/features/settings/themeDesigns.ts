// Preset theme designs for the Appearance panel: each bundles a color mode,
// an accent, and a preview color used to render the selection swatch.

import type { Accent } from "@/types";

// Identifiers for the preset theme designs available in the Appearance panel.
export type ThemeDesignId =
  | "classic"
  | "midnight"
  | "editorial"
  | "sunset"
  | "slate"
  | "meadow";

// Shape of a preset theme design: id, label, mode, accent, and preview color.
export interface ThemeDesign {
  id: ThemeDesignId;
  name: string;
  description: string;
  mode: "light" | "dark";
  accent: Accent;
  preview: string;
}

// The full catalog of preset theme designs shown in the Appearance panel.
export const THEME_DESIGNS: ThemeDesign[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Light surfaces with the indigo accent. The default QA-REY look.",
    mode: "light",
    accent: "indigo",
    preview: "#F8F8F6",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep navy surfaces paired with the indigo accent for focused night work.",
    mode: "dark",
    accent: "indigo",
    preview: "#0E1420",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Warm paper tones with a charcoal accent for a refined, print-like feel.",
    mode: "light",
    accent: "charcoal",
    preview: "#FBF8F3",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm dark surfaces with a crimson accent for a vivid, low-light theme.",
    mode: "dark",
    accent: "crimson",
    preview: "#1C1412",
  },
  {
    id: "slate",
    name: "Slate",
    description: "Cool slate surfaces with a charcoal accent for a calm, neutral workspace.",
    mode: "dark",
    accent: "charcoal",
    preview: "#16181C",
  },
  {
    id: "meadow",
    name: "Meadow",
    description: "Soft green-tinted surfaces with a gold accent for a fresh, airy feel.",
    mode: "light",
    accent: "gold",
    preview: "#F6F8F4",
  },
];

// Flat list of all theme design ids, derived from THEME_DESIGNS.
export const THEME_DESIGN_IDS = THEME_DESIGNS.map((d) => d.id);

// Type guard that verifies a value is a known theme design id.
export function isThemeDesignId(value: unknown): value is ThemeDesignId {
  return (
    typeof value === "string" &&
    (THEME_DESIGN_IDS as string[]).includes(value)
  );
}
