import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import { getContainer } from "@/server/container";
import { fakeAuth, fakeAttempts, fakeDictionaryCache, fakeDictionaryProvider, fakeSavedWords, fakeTranslator, fakeLeaderboard, fakeCredits, fakePoints, fakeProgress, fakePromptRepo, fakeReferences } from "@/test/fakes";

import { GET } from "./route";

vi.mock("@/server/container", () => ({ getContainer: vi.fn() }));

const exchange = vi.fn();

beforeEach(() => {
  exchange.mockReset().mockResolvedValue(undefined);
  vi.mocked(getContainer).mockResolvedValue({
    auth: fakeAuth({ exchangeCodeForSession: exchange }),
    profiles: { findById: vi.fn(), update: vi.fn() },
    avatars: { upload: vi.fn(), remove: vi.fn() },
    roles: { isAdmin: vi.fn() },
    users: { list: vi.fn(), find: vi.fn(), update: vi.fn(), overview: vi.fn() },
    prompts: fakePromptRepo(),
    sentencePrompts: { list: vi.fn(), get: vi.fn(), countByCategory: vi.fn() },
    credits: fakeCredits(),
    grader: { grade: vi.fn() },
    gradeCache: { get: vi.fn(), set: vi.fn() },
    sentenceProgress: fakeProgress(),
    points: fakePoints(),
    references: fakeReferences(),
    suggester: { suggest: vi.fn() },
    dictionary: fakeDictionaryProvider(),
    dictionaryCache: fakeDictionaryCache(),
    savedWords: fakeSavedWords(),
    translator: fakeTranslator(),
    attempts: fakeAttempts(),
    leaderboard: fakeLeaderboard(),
  });
});

const call = (query: string) =>
  GET(new NextRequest(`http://localhost:3000/auth/callback${query}`));
const location = (res: Response) => res.headers.get("location");

describe("GET /auth/callback", () => {
  it("GGL-AC-05: valid code → creates a session and goes to /dashboard", async () => {
    const res = await call("?code=abc");
    expect(exchange).toHaveBeenCalledExactlyOnceWith("abc");
    expect(res.status).toBe(307);
    expect(location(res)).toBe("http://localhost:3000/dashboard");
  });

  it("GGL-AC-05: honours next when it is an internal path", async () => {
    const res = await call("?code=abc&next=%2Flessons%3Ftab%3D1");
    expect(location(res)).toBe("http://localhost:3000/lessons?tab=1");
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com"])(
    "GGL-AC-06: unsafe next (%s) is ignored",
    async (next) => {
      const res = await call(`?code=abc&next=${encodeURIComponent(next)}`);
      expect(location(res)).toBe("http://localhost:3000/dashboard");
    }
  );

  it("GGL-AC-07: Google reports error/cancel → /login?error=oauth_failed, code not exchanged", async () => {
    const res = await call("?error=access_denied&error_description=User+cancelled");
    expect(location(res)).toBe("http://localhost:3000/login?error=oauth_failed");
    expect(exchange).not.toHaveBeenCalled();
  });

  it("GGL-AC-07: missing code → /login?error=missing_code", async () => {
    const res = await call("");
    expect(location(res)).toBe("http://localhost:3000/login?error=missing_code");
    expect(exchange).not.toHaveBeenCalled();
  });

  it("GGL-AC-07: code exchange fails → /login?error=auth_failed", async () => {
    exchange.mockRejectedValue(new UnauthorizedError("invalid grant"));
    const res = await call("?code=expired");
    expect(location(res)).toBe("http://localhost:3000/login?error=auth_failed");
  });
});
