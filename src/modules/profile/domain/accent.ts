/** Accent colour of the dark blocks and solid buttons: a lowercase #rrggbb colour, or null for the default black. */
export type Accent = string | null;

export type AccentTone = "deep" | "medium" | "light";

/**
 * Ready-made accents: deep, then medium, then light. Deep and medium ones take white text (7:1 or more on deep, 5:1 or
 * more on medium); light ones take near-black text (7:1 or more). All checked in the tests.
 * `id` is the key of the translated name. The default black is not listed: it is `null`.
 */
export const ACCENT_PRESETS = [
  { id: "navy", color: "#0f1b3f", tone: "deep" },
  { id: "indigo", color: "#2a2a72", tone: "deep" },
  { id: "teal", color: "#0b3d3f", tone: "deep" },
  { id: "forest", color: "#12362a", tone: "deep" },
  { id: "plum", color: "#3b1d4f", tone: "deep" },
  { id: "burgundy", color: "#5a1228", tone: "deep" },
  { id: "brick", color: "#6b1f1a", tone: "deep" },
  { id: "espresso", color: "#3a2418", tone: "deep" },
  { id: "slate", color: "#1e293b", tone: "deep" },
  { id: "blue", color: "#2f5fb3", tone: "medium" },
  { id: "sky", color: "#1f6f9f", tone: "medium" },
  { id: "jade", color: "#1b7a78", tone: "medium" },
  { id: "green", color: "#2f7a4d", tone: "medium" },
  { id: "violet", color: "#6a4fb0", tone: "medium" },
  { id: "magenta", color: "#a23a7a", tone: "medium" },
  { id: "coral", color: "#c0432f", tone: "medium" },
  { id: "amber", color: "#9a5a12", tone: "medium" },
  { id: "steel", color: "#5b6472", tone: "medium" },
  { id: "mintLight", color: "#8fd1ae", tone: "light" },
  { id: "skyLight", color: "#8dbdee", tone: "light" },
  { id: "lavenderLight", color: "#b4a2e6", tone: "light" },
  { id: "roseLight", color: "#ee9fb3", tone: "light" },
  { id: "peach", color: "#f4b27f", tone: "light" },
  { id: "butter", color: "#ecd05f", tone: "light" },
  { id: "sand", color: "#d2b992", tone: "light" },
  { id: "aqua", color: "#78cfc9", tone: "light" },
  { id: "silver", color: "#aab3c0", tone: "light" },
] as const satisfies readonly { id: string; color: string; tone: AccentTone }[];

/** The accent for a stored or submitted value: a ready-made colour in canonical form, or null for anything else. */
export function parseAccent(value: unknown): Accent {
  if (typeof value !== "string") return null;
  const color = value.trim().toLowerCase();
  return ACCENT_PRESETS.some((preset) => preset.color === color) ? color : null;
}

function channel(hex: string, start: number): number {
  const value = parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

/**
 * True when text on this colour must be near-black instead of white (the colour is lighter than mid-grey).
 * The inline script in `lib/theme.ts` repeats this rule; a test keeps the two in step.
 */
export function isLightAccent(hex: string): boolean {
  const luminance = 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
  return luminance > 0.179;
}
