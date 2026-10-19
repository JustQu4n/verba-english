import { describe, expect, it } from "vitest";

import { ACCENT_PRESETS, isLightAccent, parseAccent } from "./accent";

function channel(hex: string, start: number): number {
  const value = parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

/** WCAG contrast ratio of white text on this colour. */
const whiteContrast = (hex: string) => 1.05 / (luminance(hex) + 0.05);

/** WCAG contrast ratio of near-black text (#0a0a0a) on this colour. */
const inkContrast = (hex: string) => (luminance(hex) + 0.05) / (luminance("#0a0a0a") + 0.05);

describe("accent", () => {
  it("BGC-AC-01: a ready-made colour is accepted in lowercase, with spaces trimmed", () => {
    expect(parseAccent("#0F1B3F")).toBe("#0f1b3f");
    expect(parseAccent("  #12362a ")).toBe("#12362a");
  });

  it.each(["", "red", "#fff", "#ff0000", "#0f1b3", "#0f1b3f0", "url(x)", "javascript:1", null, undefined, 7, {}])(
    "BGC-AC-01: %j is not an offered accent",
    (value) => {
      expect(parseAccent(value)).toBeNull();
    }
  );

  it("BGC-AC-02: text is readable on every preset: white at 7:1 on deep, white at 5:1 on medium, near-black at 7:1 on light", () => {
    for (const preset of ACCENT_PRESETS) {
      if (preset.tone === "light") expect(inkContrast(preset.color), preset.id).toBeGreaterThanOrEqual(7);
      else expect(whiteContrast(preset.color), preset.id).toBeGreaterThanOrEqual(preset.tone === "deep" ? 7 : 5);
    }
  });

  it("BGC-AC-02: deep, medium and light colours are all offered, in that order", () => {
    const tones = ACCENT_PRESETS.map((p) => p.tone);
    expect(new Set(tones)).toEqual(new Set(["deep", "medium", "light"]));
    expect(tones.indexOf("medium")).toBeGreaterThan(tones.lastIndexOf("deep"));
    expect(tones.indexOf("light")).toBeGreaterThan(tones.lastIndexOf("medium"));
  });

  it("BGC-AC-02: the text colour rule agrees with each preset's tone, and with black as the default", () => {
    for (const preset of ACCENT_PRESETS) expect(isLightAccent(preset.color), preset.id).toBe(preset.tone === "light");
    expect(isLightAccent("#0a0a0a")).toBe(false);
  });

  it("BGC-AC-03: preset ids and colours are unique, and each is a lowercase #rrggbb", () => {
    expect(new Set(ACCENT_PRESETS.map((p) => p.id)).size).toBe(ACCENT_PRESETS.length);
    expect(new Set(ACCENT_PRESETS.map((p) => p.color)).size).toBe(ACCENT_PRESETS.length);
    for (const preset of ACCENT_PRESETS) expect(preset.color).toMatch(/^#[0-9a-f]{6}$/);
  });
});
