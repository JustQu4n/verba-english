import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { GeminiAnswerSuggester } from "./gemini-answer-suggester";

const reply = (text: string) => ({ status: "completed", steps: [{ type: "model_output", content: [{ type: "text", text }] }] });
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

function suggester(fetch: typeof globalThis.fetch, apiKey: string | null = "key") {
  return new GeminiAnswerSuggester({ apiKey: apiKey ?? undefined, model: "m", thinkingLevel: "minimal", fetch });
}

const request = { vietnamese: "Tôi muốn đi biển.", level: "beginner", hint: "want, beach" } as const;
const ANSWER = { text: "I want to go to the beach.", structureVi: "want to + V", structureEn: "want to + verb" };

describe("GeminiAnswerSuggester", () => {
  it("ANS-AC-12: sends the sentence, level and key words and reads the answers from the JSON reply", async () => {
    const fetch = vi.fn().mockResolvedValue(ok(reply(JSON.stringify({ answers: [ANSWER] }))));
    await expect(suggester(fetch).suggest(request)).resolves.toEqual([ANSWER]);
    const [, init] = fetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.input).toContain("Level: beginner");
    expect(body.input).toContain("Vietnamese: Tôi muốn đi biển.");
    expect(body.input).toContain("Key words: want, beach");
    expect(body.store).toBe(false);
    expect(init.headers["x-goog-api-key"]).toBe("key");
    expect(body.response_format.schema.required).toEqual(["answers"]);
  });

  it("ANS-AC-12: a missing structure becomes empty text", async () => {
    const fetch = vi.fn().mockResolvedValue(ok(reply(JSON.stringify({ answers: [{ text: "I go." }] }))));
    await expect(suggester(fetch).suggest(request)).resolves.toEqual([{ text: "I go.", structureVi: "", structureEn: "" }]);
  });

  it.each([
    ["not JSON", ok(reply("nope"))],
    ["an empty list", ok(reply(JSON.stringify({ answers: [] })))],
    ["a wrong shape", ok(reply(JSON.stringify({ answers: [{ text: "" }] })))],
    ["an HTTP error", new Response("quota exceeded for key secret", { status: 429 })],
  ])("ANS-AC-12: %s is an infrastructure error without the body", async (_n, response) => {
    const promise = suggester(vi.fn().mockResolvedValue(response)).suggest(request);
    await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(promise).rejects.not.toThrow(/secret/);
  });

  it("ANS-AC-12: a missing key fails without calling out, and a network failure is wrapped", async () => {
    const fetch = vi.fn();
    await expect(suggester(fetch, null).suggest(request)).rejects.toBeInstanceOf(InfrastructureError);
    expect(fetch).not.toHaveBeenCalled();
    await expect(suggester(vi.fn().mockRejectedValue(new Error("boom"))).suggest(request)).rejects.toBeInstanceOf(InfrastructureError);
  });
});
