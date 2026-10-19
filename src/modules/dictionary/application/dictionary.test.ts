import { afterEach, describe, expect, it, vi } from "vitest";

import { InfrastructureError, UnauthorizedError, ValidationError } from "@/core/errors";
import { fakeAuth, fakeDictionaryCache, fakeDictionaryProvider, fakeSavedWords, sampleEntry } from "@/test/fakes";

import { lookupWord } from "./lookup-word";
import { listSavedWords, removeWord, saveWord } from "./saved-words";

const user = { id: "u1", email: "a@b.c" };
const signedIn = () => fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(user) });

afterEach(() => vi.restoreAllMocks());

function deps(over: { entry?: ReturnType<typeof sampleEntry> | null; cached?: ReturnType<typeof sampleEntry> | null } = {}) {
  const cache = fakeDictionaryCache(over.cached);
  const provider = fakeDictionaryProvider(over.entry === undefined ? sampleEntry() : over.entry);
  const savedWords = fakeSavedWords();
  return { auth: signedIn(), cache, provider, savedWords };
}

describe("lookupWord", () => {
  it("DIC-AC-02: a guest is refused before anything is read", async () => {
    const d = { ...deps(), auth: fakeAuth() };
    await expect(lookupWord(d, "word")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(d.cache.get).not.toHaveBeenCalled();
    expect(d.provider.lookup).not.toHaveBeenCalled();
  });

  it("DIC-AC-01: a bad word is refused with a code and reads nothing", async () => {
    const d = deps();
    await expect(lookupWord(d, "123")).rejects.toThrow(ValidationError);
    await expect(lookupWord(d, "123")).rejects.toThrow("invalid_word");
    expect(d.provider.lookup).not.toHaveBeenCalled();
  });

  it("DIC-AC-03: a cached word does not call the dictionary", async () => {
    const d = deps({ cached: sampleEntry() });
    const result = await lookupWord(d, "Convenient.");
    expect(result.entry?.word).toBe("convenient");
    expect(d.cache.get).toHaveBeenCalledWith("convenient");
    expect(d.provider.lookup).not.toHaveBeenCalled();
  });

  it("DIC-AC-04: an uncached word is fetched and stored", async () => {
    const d = deps();
    const result = await lookupWord(d, "convenient");
    expect(result.entry).toEqual(sampleEntry());
    expect(d.provider.lookup).toHaveBeenCalledWith("convenient");
    expect(d.cache.put).toHaveBeenCalledWith("convenient", sampleEntry());
  });

  it("DIC-AC-04: a broken cache does not break the lookup", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const d = deps();
    d.cache = fakeDictionaryCache(undefined, {
      get: vi.fn().mockRejectedValue(new InfrastructureError("x")),
      put: vi.fn().mockRejectedValue(new InfrastructureError("x")),
    });
    await expect(lookupWord(d, "convenient")).resolves.toMatchObject({ entry: { word: "convenient" } });
  });

  it("DIC-AC-05: an unknown word is not found, nothing is cached, and a dictionary failure is an infrastructure error", async () => {
    const d = deps({ entry: null });
    await expect(lookupWord(d, "zzzz")).resolves.toEqual({ entry: null, saved: false });
    // The unknown word is remembered as unknown (see DIC-AC-20), nothing else is stored.
    expect(d.cache.put).toHaveBeenCalledWith("zzzz", null);
    d.savedWords = fakeSavedWords({ has: vi.fn().mockResolvedValue(true) });
    await expect(lookupWord(d, "zzzz")).resolves.toEqual({ entry: null, saved: true });
    expect(d.savedWords.has).toHaveBeenCalledWith("u1", "zzzz");

    const down = deps({ entry: null });
    down.provider = fakeDictionaryProvider(null, { lookup: vi.fn().mockRejectedValue(new InfrastructureError("down")) });
    await expect(lookupWord(down, "zzzz")).rejects.toBeInstanceOf(InfrastructureError);
    expect(down.cache.put).not.toHaveBeenCalled();
  });

  it("DIC-AC-06: the result says whether the learner saved the word", async () => {
    const d = deps();
    d.savedWords = fakeSavedWords({ has: vi.fn().mockResolvedValue(true) });
    await expect(lookupWord(d, "convenient")).resolves.toMatchObject({ saved: true });
    expect(d.savedWords.has).toHaveBeenCalledWith("u1", "convenient");
  });
});

describe("saved words", () => {
  it("DIC-AC-02: a guest cannot save, remove or list", async () => {
    const d = { ...deps(), auth: fakeAuth() };
    await expect(saveWord(d, "word")).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(removeWord(d, "word")).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(listSavedWords(d)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(d.savedWords.save).not.toHaveBeenCalled();
    expect(d.savedWords.remove).not.toHaveBeenCalled();
    expect(d.savedWords.list).not.toHaveBeenCalled();
  });

  it("DIC-AC-07: saves the content read on the server", async () => {
    const d = deps();
    await expect(saveWord(d, "Convenient")).resolves.toEqual(sampleEntry());
    expect(d.savedWords.save).toHaveBeenCalledWith("u1", sampleEntry());
  });

  it("DIC-AC-07: a word the dictionary does not know is still saved, on its own", async () => {
    const d = deps({ entry: null });
    const saved = await saveWord(d, "zzzz");
    expect(saved).toEqual({ word: "zzzz", ipa: null, audioUrl: null, meanings: [], source: "manual" });
    expect(d.savedWords.save).toHaveBeenCalledWith("u1", saved);
    await expect(saveWord(d, "")).rejects.toThrow("invalid_word");
  });

  it("DIC-AC-08: removes the word of the signed-in learner and lists the saved ones", async () => {
    const d = deps();
    await removeWord(d, "Convenient.");
    expect(d.savedWords.remove).toHaveBeenCalledWith("u1", "convenient");
    await expect(removeWord(d, "%%")).rejects.toThrow("invalid_word");

    const saved = [{ entry: sampleEntry(), savedAt: new Date("2026-10-01") }];
    d.savedWords = fakeSavedWords({ list: vi.fn().mockResolvedValue(saved) });
    await expect(listSavedWords(d)).resolves.toBe(saved);
    expect(d.savedWords.list).toHaveBeenCalledWith("u1");
  });
});

describe("lookup cache", () => {
  it("DIC-AC-20: a remembered \"not found\" answers without calling the dictionary", async () => {
    const d = deps({ cached: null });
    await expect(lookupWord(d, "zzzz")).resolves.toEqual({ entry: null, saved: false });
    expect(d.provider.lookup).not.toHaveBeenCalled();
  });

  it("DIC-AC-21: learners asking for the same new word at the same time share one dictionary call", async () => {
    const d = deps();
    let release: () => void = () => {};
    d.provider = fakeDictionaryProvider(sampleEntry(), {
      lookup: vi.fn().mockImplementation(() => new Promise((resolve) => (release = () => resolve(sampleEntry())))),
    });
    const first = lookupWord(d, "convenient");
    const second = lookupWord(d, "convenient");
    await vi.waitFor(() => expect(d.provider.lookup).toHaveBeenCalled());
    release();
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(d.provider.lookup).toHaveBeenCalledTimes(1);
    // Afterwards the shared call is forgotten: a later lookup asks again.
    d.cache = fakeDictionaryCache();
    d.provider = fakeDictionaryProvider();
    await lookupWord(d, "convenient");
    expect(d.provider.lookup).toHaveBeenCalledTimes(1);
  });
});
