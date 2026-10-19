import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { GeminiWordTranslator } from "./gemini-word-translator";
import { buildWordInput, parseWordReply, WORD_SYSTEM_INSTRUCTION } from "./gemini-word-prompt";

const reply = (text: string) => ({ status: "completed", steps: [{ type: "model_output", content: [{ type: "text", text }] }] });
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const translator = (fetch: typeof globalThis.fetch, apiKey: string | null = "key") =>
  new GeminiWordTranslator({ apiKey: apiKey ?? undefined, model: "m", thinkingLevel: "minimal", fetch });

const GOOD = { ipa: "/kənˈviː.ni.ənt/", meanings: [{ pos: "Tính từ", definition: "Thuận tiện.", example: "It is convenient." }] };

describe("GeminiWordTranslator", () => {
  it("DIC-AC-17: sends the word as data and reads Vietnamese meanings from the JSON reply", async () => {
    const fetch = vi.fn().mockResolvedValue(ok(reply(JSON.stringify(GOOD))));
    await expect(translator(fetch).translate("convenient")).resolves.toEqual({
      word: "convenient",
      ipa: "/kənˈviː.ni.ənt/",
      audioUrl: null,
      meanings: [{ definition: "Thuận tiện.", pos: "Tính từ", example: "It is convenient.", vietnamese: true }],
      source: "ai",
    });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.input).toBe(buildWordInput("convenient"));
    expect(body.system_instruction).toBe(WORD_SYSTEM_INSTRUCTION);
    expect(body.store).toBe(false);
    expect(body.response_format.schema.required).toEqual(["ipa", "meanings"]);
  });

  it("DIC-AC-17: keeps at most three meanings, drops empty ones and trims text", () => {
    const many = { ipa: "  ", meanings: [{ definition: " a " }, { definition: "" }, { definition: "b" }, { definition: "c" }, { definition: "d" }] };
    const entry = parseWordReply(JSON.stringify(many), "x");
    expect(entry?.ipa).toBeNull();
    expect(entry?.meanings.map((m) => m.definition)).toEqual(["a", "b", "c"]);
    expect(entry?.meanings[0]).toMatchObject({ pos: null, example: null });
    expect(parseWordReply(JSON.stringify({ ipa: "", meanings: [] }), "x")?.meanings).toEqual([]);
  });

  it("DIC-AC-17: JSON in the wrong shape is unusable", () => {
    expect(parseWordReply("not json", "x")).toBeNull();
    expect(parseWordReply(JSON.stringify({ ipa: "" }), "x")).toBeNull();
  });

  it("DIC-AC-17: an unusable reply, a failing request and a missing key are infrastructure errors without the original message", async () => {
    const unusable = translator(vi.fn().mockResolvedValue(ok(reply("nope"))));
    await expect(unusable.translate("x")).rejects.toBeInstanceOf(InfrastructureError);
    const down = translator(vi.fn().mockResolvedValue(new Response("secret body", { status: 500 })));
    const call = down.translate("x");
    await expect(call).rejects.toBeInstanceOf(InfrastructureError);
    await expect(call).rejects.not.toThrow(/secret/);
    await expect(translator(vi.fn(), null).translate("x")).rejects.toBeInstanceOf(InfrastructureError);
  });
});
