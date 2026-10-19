import { describe, expect, it } from "vitest";

import { applyAccent, type AppearanceRoot } from "./appearance";

function fakeRoot() {
  const attributes = new Map<string, string>();
  const variables = new Map<string, string>();
  const root: AppearanceRoot = {
    setAttribute: (name, value) => void attributes.set(name, value),
    removeAttribute: (name) => void attributes.delete(name),
    style: { setProperty: (name, value) => void variables.set(name, value), removeProperty: (name) => void variables.delete(name) },
  };
  return { root, attributes, variables };
}

describe("applyAccent", () => {
  it("BGC-AC-05: an accent sets the marker and the colour variable", () => {
    const { root, attributes, variables } = fakeRoot();
    applyAccent(root, "#0f1b3f");
    expect(attributes.get("data-accent")).toBe("custom");
    expect(variables.get("--user-accent")).toBe("#0f1b3f");
  });

  it("BGC-AC-05: null removes the marker and the colour, back to the default black", () => {
    const { root, attributes, variables } = fakeRoot();
    applyAccent(root, "#0f1b3f");
    applyAccent(root, null);
    expect(attributes.has("data-accent")).toBe(false);
    expect(variables.has("--user-accent")).toBe(false);
  });

  it("BGC-AC-05: the theme attribute is never touched", () => {
    const { root, attributes } = fakeRoot();
    applyAccent(root, "#12362a");
    expect(attributes.has("data-theme")).toBe(false);
  });

  it("BGC-AC-05: a light accent also asks for dark text, a deep one does not, and null clears it", () => {
    const { root, attributes } = fakeRoot();
    applyAccent(root, "#8dbdee");
    expect(attributes.get("data-accent-tone")).toBe("light");
    applyAccent(root, "#0f1b3f");
    expect(attributes.has("data-accent-tone")).toBe(false);
    applyAccent(root, "#8dbdee");
    applyAccent(root, null);
    expect(attributes.has("data-accent-tone")).toBe(false);
  });
});
