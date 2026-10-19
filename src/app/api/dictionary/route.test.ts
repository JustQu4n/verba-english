import { beforeEach, describe, expect, it, vi } from "vitest";

import { fakeAuth, fakeCredits, fakeTranslator, fakeDictionaryCache, fakeDictionaryProvider, fakeSavedWords } from "@/test/fakes";

const container = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock("@/server/container", () => ({ getContainer: async () => container.current }));
vi.mock("next/navigation", () => ({ unstable_rethrow: () => {} }));

import { GET } from "./route";
import { DELETE, GET as LIST, POST } from "./saved/route";
import { POST as TRANSLATE } from "./translate/route";

const user = { id: "u1", email: "a@b.c" };

function setup(signedIn = true, entry: Parameters<typeof fakeDictionaryProvider>[0] = undefined) {
  container.current = {
    auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(signedIn ? user : null) }),
    dictionary: fakeDictionaryProvider(entry),
    dictionaryCache: fakeDictionaryCache(),
    savedWords: fakeSavedWords(),
    credits: fakeCredits(5),
    translator: fakeTranslator(),
  };
}

const get = (query: string) => GET(new Request(`http://x/api/dictionary${query}`));

beforeEach(() => setup());

describe("/api/dictionary", () => {
  it("DIC-AC-11: returns the entry", async () => {
    const res = await get("?word=convenient");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ entry: { word: "convenient" }, saved: false });
  });

  it("DIC-AC-11: a missing or bad word is 400, a guest is 401, an unknown word is an empty answer", async () => {
    expect((await get("")).status).toBe(400);
    expect((await get("?word=123")).status).toBe(400);
    setup(false);
    expect((await get("?word=a")).status).toBe(401);
    setup(true, null);
    const res = await get("?word=zzz");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ entry: null, saved: false });
  });

  it("DIC-AC-11: saves, lists and removes words", async () => {
    const post = (body: string) => POST(new Request("http://x/api/dictionary/saved", { method: "POST", body }));
    expect((await post(JSON.stringify({ word: "convenient" }))).status).toBe(200);
    expect((await post("not json")).status).toBe(400);
    expect((await post(JSON.stringify([1]))).status).toBe(400);
    expect((await LIST()).status).toBe(200);
    expect((await DELETE(new Request("http://x/api/dictionary/saved?word=convenient", { method: "DELETE" }))).status).toBe(200);
    expect((await DELETE(new Request("http://x/api/dictionary/saved", { method: "DELETE" }))).status).toBe(400);
  });

  it("DIC-AC-16: translate answers with the entry and the new balance; 400 for a bad word, 401 for a guest, 402 without credits", async () => {
    const post = (body: string) => TRANSLATE(new Request("http://x/api/dictionary/translate", { method: "POST", body }));
    const ok = await post(JSON.stringify({ word: "convenient" }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ entry: { word: "convenient", source: "ai" }, credits: 4 });
    expect((await post("nope")).status).toBe(400);
    expect((await post(JSON.stringify({ word: "123" }))).status).toBe(400);
    setup(false);
    expect((await post(JSON.stringify({ word: "a" }))).status).toBe(401);
    setup();
    container.current.credits = fakeCredits(0);
    expect((await post(JSON.stringify({ word: "a" }))).status).toBe(402);
  });
});
