import { describe, expect, it } from "vitest";

import { nextTheme, parseTheme, resolveTheme, THEME_ATTRIBUTE, THEME_INIT_SCRIPT } from "./theme";

/** Runs the inline script against fake browser globals and reports whether it put the page in dark mode. */
function runScript({ stored, prefersDark, storageBlocked = false }: { stored?: string | null; prefersDark: boolean; storageBlocked?: boolean }) {
  const attributes = new Map<string, string>();
  const document = {
    documentElement: {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
    },
  };
  const localStorage = {
    getItem: () => {
      if (storageBlocked) throw new Error("blocked");
      return stored ?? null;
    },
  };
  const matchMedia = () => ({ matches: prefersDark });
  new Function("document", "localStorage", "matchMedia", THEME_INIT_SCRIPT)(document, localStorage, matchMedia);
  return attributes.get(THEME_ATTRIBUTE) === "dark";
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
    expect(runScript(input)).toBe(dark);
  });

  it("THM-AC-02: the inline script survives a blocked localStorage and follows the system", () => {
    expect(runScript({ prefersDark: true, storageBlocked: true })).toBe(true);
    expect(runScript({ prefersDark: false, storageBlocked: true })).toBe(false);
  });

  it("THM-AC-03: the next theme is the other one", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});
