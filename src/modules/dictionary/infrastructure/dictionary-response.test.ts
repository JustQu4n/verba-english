import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { parseLookupResponse } from "./dictionary-response";
import { HttpDictionaryProvider } from "./http-dictionary-provider";

const BASE = "https://dict.test";

const beautiful = {
  exists: true,
  word: "beautiful",
  results: [
    {
      lang_code: "en",
      audio: "/api/v1/tts?word=beautiful&lang=en",
      meanings: [
        { definition: "Đẹp; hay.", definition_lang: "vi", example: null, pos: "Tính từ" },
        { definition: "Pleasing.", definition_lang: "en", example: "A beautiful day.", pos: "Adjective" },
        { definition: "Tốt, tốt đẹp.", definition_lang: "vi", example: null, pos: "Tính từ" },
      ],
      pronunciations: [
        { ipa: "[bju.ɾə.fəl]", region: null },
        { ipa: "byo͞oʹtĭ-fəl", region: "UK" },
        { ipa: "/ˈbju.tɪ.fəl/", region: null },
      ],
    },
  ],
};

describe("parseLookupResponse", () => {
  it("DIC-AC-09: builds an entry with Vietnamese first, the slashed IPA and a full audio address", () => {
    const entry = parseLookupResponse(beautiful, BASE);
    expect(entry).toEqual({
      word: "beautiful",
      ipa: "/ˈbju.tɪ.fəl/",
      audioUrl: "https://dict.test/api/v1/tts?word=beautiful&lang=en",
      meanings: [
        { definition: "Đẹp; hay.", pos: "Tính từ", example: null, vietnamese: true },
        { definition: "Tốt, tốt đẹp.", pos: "Tính từ", example: null, vietnamese: true },
        { definition: "Pleasing.", pos: "Adjective", example: "A beautiful day.", vietnamese: false },
      ],
      source: "dictionary",
    });
  });

  it("DIC-AC-09: keeps at most five meanings and survives missing fields", () => {
    const many = { ...beautiful, results: [{ lang_code: "vi", meanings: Array.from({ length: 8 }, (_, i) => ({ definition: `d${i}` })) }] };
    const entry = parseLookupResponse(many, BASE);
    expect(entry?.meanings).toHaveLength(5);
    expect(entry).toMatchObject({ ipa: null, audioUrl: null });
    expect(parseLookupResponse({ ...beautiful, results: [{ ...beautiful.results[0], pronunciations: [{ ipa: "x-y", region: "UK" }] }] }, BASE)?.ipa).toBe("x-y");
    expect(parseLookupResponse({ ...beautiful, results: [{ ...beautiful.results[0], audio: "http://[" }] }, "not a url")?.audioUrl).toBeNull();
  });

  it("DIC-AC-09: no word, no results or no usable meaning is not found", () => {
    for (const body of [null, "x", [], { exists: false }, { exists: true, word: "a", results: [] }, { word: "a", results: [{ meanings: [{ definition: " " }, 3] }] }, { results: beautiful.results }]) {
      expect(parseLookupResponse(body, BASE)).toBeNull();
    }
  });
});

describe("HttpDictionaryProvider", () => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

  it("DIC-AC-09: asks for English with Vietnamese definitions", async () => {
    const fetcher = vi.fn().mockResolvedValue(json(beautiful));
    const entry = await new HttpDictionaryProvider(BASE, fetcher).lookup("beautiful");
    expect(entry?.word).toBe("beautiful");
    const url = String(fetcher.mock.calls[0][0]);
    expect(url).toBe("https://dict.test/api/v1/lookup?word=beautiful&lang=en&def_lang=vi");
  });

  it("DIC-AC-09: 404 is not found", async () => {
    const fetcher = vi.fn().mockResolvedValue(json({}, 404));
    await expect(new HttpDictionaryProvider(BASE, fetcher).lookup("x")).resolves.toBeNull();
  });

  it("DIC-AC-09: network errors, bad status and bad JSON are infrastructure errors without the original message", async () => {
    const run = (fetcher: typeof fetch) => new HttpDictionaryProvider(BASE, fetcher).lookup("x");
    const network = run(vi.fn().mockRejectedValue(new Error("ECONNRESET secret")));
    await expect(network).rejects.toBeInstanceOf(InfrastructureError);
    await expect(network).rejects.not.toThrow(/secret/);
    await expect(run(vi.fn().mockResolvedValue(json({}, 500)))).rejects.toBeInstanceOf(InfrastructureError);
    await expect(run(vi.fn().mockResolvedValue(new Response("<html>")))).rejects.toBeInstanceOf(InfrastructureError);
  });
});
