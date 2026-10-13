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
    expect(input).toEqual({ level: "advanced", category: "law-justice", vietnamese: " Câu. ", hint: " h ", published: true, answers: [] });
    expect(values).toEqual({ level: "advanced", category: "law-justice", vietnamese: " Câu. ", hint: " h ", published: true, answers: [] });
  });

  it("APR-AC-13: a missing checkbox means draft and missing fields become empty strings", () => {
    const { input } = readPromptForm(form({}));
    expect(input).toEqual({ level: "", category: "", vietnamese: "", hint: "", published: false, answers: [] });
  });
});

describe("readPromptForm answers", () => {
  const withAnswers = (rows: [string, string, string][]) => {
    const data = form({ level: "beginner" });
    for (const [text, vi, en] of rows) {
      data.append("answerText", text);
      data.append("answerStructureVi", vi);
      data.append("answerStructureEn", en);
    }
    return data;
  };

  it("ANS-AC-10: zips the repeated fields into answers and drops completely blank rows", () => {
    const { input } = readPromptForm(
      withAnswers([
        ["I go.", "go + nơi chốn", "go + place"],
        ["  ", "", " "],
        ["I went.", "", ""],
      ])
    );
    expect(input.answers).toEqual([
      { text: "I go.", structureVi: "go + nơi chốn", structureEn: "go + place" },
      { text: "I went.", structureVi: "", structureEn: "" },
    ]);
  });

  it("ANS-AC-10: a row with notes but no answer is kept so validation can report it", () => {
    expect(readPromptForm(withAnswers([["", "ghi chú", ""]])).input.answers).toHaveLength(1);
  });

  it("ANS-AC-10: the values to show again equal what was typed", () => {
    const { input, values } = readPromptForm(withAnswers([["I go.", "a", "b"]]));
    expect(values.answers).toEqual(input.answers);
  });

  it("ANS-AC-10: answer errors map to the answers field", () => {
    const error = new ValidationError("x", [{ path: ["answers", 0, "text"], message: "answer_required" }]);
    expect(toPromptFormErrors(error)).toEqual({ fieldErrors: { answers: "answer_required" } });
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
