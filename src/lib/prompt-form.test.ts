import { afterEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/core/errors";

import { readPromptForm, toPromptFormErrors } from "./prompt-form";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(entries)) data.set(k, v);
  return data;
};

afterEach(() => vi.restoreAllMocks());

describe("readPromptForm", () => {
  it("APR-AC-13: reads fields and treats a checked box as published", () => {
    const { input, values } = readPromptForm(
      form({ level: "advanced", category: "law-justice", vietnamese: " Câu. ", hint: " h ", published: "on" })
    );
    expect(input).toEqual({ level: "advanced", category: "law-justice", vietnamese: " Câu. ", hint: " h ", published: true });
    expect(values).toEqual({ level: "advanced", category: "law-justice", vietnamese: " Câu. ", hint: " h ", published: true });
  });

  it("APR-AC-13: a missing checkbox means draft and missing fields become empty strings", () => {
    const { input } = readPromptForm(form({}));
    expect(input).toEqual({ level: "", category: "", vietnamese: "", hint: "", published: false });
  });
});

describe("toPromptFormErrors", () => {
  it("APR-AC-13: turns validation issues into per-field codes (first issue per field)", () => {
    const error = new ValidationError("x", [
      { path: ["vietnamese"], message: "vietnamese_required" },
      { path: ["vietnamese"], message: "vietnamese_too_long" },
      { path: ["hint"], message: "hint_required" },
      { path: ["bogus"], message: "ignored" },
    ]);
    expect(toPromptFormErrors(error)).toEqual({ fieldErrors: { vietnamese: "vietnamese_required", hint: "hint_required" } });
  });

  it.each<[Error, string]>([
    [new UnauthorizedError("x"), "unauthorized"],
    [new ForbiddenError("x"), "forbidden"],
    [new NotFoundError("x"), "not_found"],
  ])("APR-AC-13: maps %s to the form error %s", (error, code) => {
    expect(toPromptFormErrors(error)).toEqual({ formError: code });
  });

  it("APR-AC-13: unknown errors become a generic code and are logged", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(toPromptFormErrors(new Error("db down"))).toEqual({ formError: "unknown" });
    expect(log).toHaveBeenCalled();
  });
});
