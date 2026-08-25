// Appearance configuration: accent definitions shared by the settings UI
// and any consumer that needs the canonical accent palette.

import type { Accent } from "@/types";

// Maps each accent key to its primary hex color used across the UI.
export const ACCENT_HEX: Record<Accent, string> = {
  gold: "#C8A54B",
  indigo: "#2F6798",
  crimson: "#ED1C25",
  charcoal: "#363435",
};
