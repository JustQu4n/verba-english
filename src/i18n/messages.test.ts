import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import vi from "../../messages/vi.json";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? { ...acc, [path]: value } : { ...acc, ...flatten(value, path) };
  }, {});
}

const viFlat = flatten(vi as Tree);
const enFlat = flatten(en as Tree);
const params = (text: string) => [...text.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort();

describe("messages", () => {
  it("I18N-AC-01: vi and en have the same set of keys", () => {
    expect(Object.keys(enFlat).sort()).toEqual(Object.keys(viFlat).sort());
  });

  it("I18N-AC-02: no empty strings", () => {
    const empty = [...Object.entries(viFlat), ...Object.entries(enFlat)].filter(([, v]) => !v.trim());
    expect(empty).toEqual([]);
  });

  it("I18N-AC-03: each string has the same parameters in both locales", () => {
    const mismatched = Object.keys(viFlat).filter(
      (key) => JSON.stringify(params(viFlat[key])) !== JSON.stringify(params(enFlat[key] ?? ""))
    );
    expect(mismatched).toEqual([]);
  });
});
