import { describe, expect, it } from "vitest";

import { ACCENT_PRESETS, isLightAccent } from "@/modules/profile/domain/accent";

import { nextTheme, parseTheme, resolveTheme, THEME_ATTRIBUTE, THEME_INIT_SCRIPT } from "./theme";

/** Runs the inline script against fake browser globals and reports what it put on <html>. */
function runScript({ stored, accent, prefersDark, storageBlocked = false }: { stored?: string | null; accent?: string | null; prefersDark: boolean; storageBlocked?: boolean }) {
  const attributes = new Map<string, string>();
  const variables = new Map<string, string>();
  const document = {
    documentElement: {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      style: { setProperty: (name: string, value: string) => variables.set(name, value) },
    },
  };
  const localStorage = {
    getItem: (key: string) => {
      if (storageBlocked) throw new Error("blocked");
      return (key === "accent" ? accent : stored) ?? null;
    },
  };
  const matchMedia = () => ({ matches: prefersDark });
  new Function("document", "localStorage", "matchMedia", THEME_INIT_SCRIPT)(document, localStorage, matchMedia);
  return { dark: attributes.get(THEME_ATTRIBUTE) === "dark", marker: attributes.get("data-accent"), color: variables.get("--user-accent"), tone: attributes.get("data-accent-tone") };
}

describe("theme", () => {
  it("THM-AC-01: a saved choice wins over the system; otherwise the system decides", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });

  it.each(["", "auto", "DARK", 1, undefined, {}])("THM-AC-01: stored value %j is ignored", (value) => {
    expect(parseTheme(value)).toBeNull();
    expect(resolveTheme(value, true)).toBe("dark");
    expect(resolveTheme(value, false)).toBe("light");
  });

  it.each([
    { stored: "dark", prefersDark: false, dark: true },
    { stored: "light", prefersDark: true, dark: false },
    { stored: null, prefersDark: true, dark: true },
    { stored: null, prefersDark: false, dark: false },
    { stored: "garbage", prefersDark: true, dark: true },
    { stored: "garbage", prefersDark: false, dark: false },
  ])("THM-AC-02: the inline script sets dark=$dark for stored=$stored, system dark=$prefersDark", ({ dark, ...input }) => {
    expect(runScript(input).dark).toBe(dark);
  });

  it("THM-AC-02: the inline script survives a blocked localStorage and follows the system", () => {
    expect(runScript({ prefersDark: true, storageBlocked: true }).dark).toBe(true);
    expect(runScript({ prefersDark: false, storageBlocked: true }).dark).toBe(false);
  });

  it("THM-AC-03: the next theme is the other one", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });

  it.each(["#0f1b3f", "#12362A"])("BGC-AC-06: the inline script sets the accent %s without touching the theme", (accent) => {
    const light = runScript({ accent, stored: "light", prefersDark: true });
    expect(light).toEqual({ dark: false, marker: "custom", color: accent.toLowerCase(), tone: undefined });
    expect(runScript({ accent, stored: "dark", prefersDark: false }).dark).toBe(true);
  });

  it.each(["", "red", "#fff", "#nope00", "url(x)", "#0f1b3f; color: red"])("BGC-AC-06: the inline script ignores the invalid accent %j", (accent) => {
    expect(runScript({ accent, stored: "dark", prefersDark: false })).toEqual({ dark: true, marker: undefined, color: undefined, tone: undefined });
  });

  it("BGC-AC-06: a blocked localStorage means no accent and the normal theme", () => {
    expect(runScript({ prefersDark: true, storageBlocked: true })).toEqual({ dark: true, marker: undefined, color: undefined, tone: undefined });
  });

  it("BGC-AC-06: the inline script asks for dark text on exactly the accents the domain calls light", () => {
    for (const preset of ACCENT_PRESETS) {
      expect(runScript({ accent: preset.color, prefersDark: false }).tone, preset.id).toBe(isLightAccent(preset.color) ? "light" : undefined);
    }
    expect(runScript({ accent: "#8DBDEE", prefersDark: false }).tone).toBe("light");
  });
});
