import { describe, expect, it, vi } from "vitest";

import { InfrastructureError, InsufficientCreditsError, NotFoundError, UnauthorizedError, ValidationError } from "@/core/errors";
import { fakeAuth, fakeCredits, fakeSavedWords, fakeTranslator, sampleEntry } from "@/test/fakes";

import { translateWord } from "./translate-word";

const user = { id: "u1", email: "a@b.c" };

function deps(over: Partial<Parameters<typeof translateWord>[0]> = {}) {
  return {
    auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(user) }),
    credits: fakeCredits(5),
    translator: fakeTranslator(),
    savedWords: fakeSavedWords(),
    ...over,
  };
}

describe("translateWord", () => {
  it("DIC-AC-16: a guest is refused before anything is read or charged", async () => {
    const d = deps({ auth: fakeAuth() });
    await expect(translateWord(d, "word")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(d.credits.balance).not.toHaveBeenCalled();
    expect(d.translator.translate).not.toHaveBeenCalled();
  });

  it("DIC-AC-16: a bad word is refused with a code and costs nothing", async () => {
    const d = deps();
    await expect(translateWord(d, "123")).rejects.toThrow(ValidationError);
    expect(d.translator.translate).not.toHaveBeenCalled();
    expect(d.credits.spend).not.toHaveBeenCalled();
  });

  it("DIC-AC-16: with no credit left the AI is not called", async () => {
    const d = deps({ credits: fakeCredits(0) });
    await expect(translateWord(d, "convenient")).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(d.translator.translate).not.toHaveBeenCalled();
    expect(d.savedWords.save).not.toHaveBeenCalled();
  });

  it("DIC-AC-16: translates, saves with the source ai, then takes one credit", async () => {
    const d = deps();
    const result = await translateWord(d, "Convenient.");
    expect(d.translator.translate).toHaveBeenCalledWith("convenient");
    expect(result.entry).toMatchObject({ word: "convenient", source: "ai" });
    expect(result.credits).toBe(4);
    expect(d.savedWords.save).toHaveBeenCalledWith("u1", result.entry);
    expect(d.credits.spend).toHaveBeenCalledWith(1);
  });

  it("DIC-AC-16: an AI failure or an unusable answer costs nothing and saves nothing", async () => {
    const failing = deps({ translator: fakeTranslator(sampleEntry(), { translate: vi.fn().mockRejectedValue(new InfrastructureError("down")) }) });
    await expect(translateWord(failing, "word")).rejects.toBeInstanceOf(InfrastructureError);
    expect(failing.credits.spend).not.toHaveBeenCalled();
    expect(failing.savedWords.save).not.toHaveBeenCalled();

    const notAWord = deps({ translator: fakeTranslator(sampleEntry({ meanings: [] })) });
    await expect(translateWord(notAWord, "asdfgh")).rejects.toThrow(NotFoundError);
    await expect(translateWord(notAWord, "asdfgh")).rejects.toThrow("cannot_translate");
    expect(notAWord.credits.spend).not.toHaveBeenCalled();
    expect(notAWord.savedWords.save).not.toHaveBeenCalled();
  });

  it("DIC-AC-16: losing the race for the last credit puts back the earlier entry, or removes the new word", async () => {
    const raced = { credits: fakeCredits(1, { spend: vi.fn().mockResolvedValue(null) }) };
    const fresh = deps(raced);
    await expect(translateWord(fresh, "convenient")).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(fresh.savedWords.remove).toHaveBeenCalledWith("u1", "convenient");

    const earlier = { word: "convenient", ipa: null, audioUrl: null, meanings: [], source: "manual" as const };
    const kept = deps({
      ...raced,
      savedWords: fakeSavedWords({ list: vi.fn().mockResolvedValue([{ entry: earlier, savedAt: new Date() }]) }),
    });
    await expect(translateWord(kept, "convenient")).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(kept.savedWords.save).toHaveBeenLastCalledWith("u1", earlier);
    expect(kept.savedWords.remove).not.toHaveBeenCalled();
  });
});
