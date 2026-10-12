import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { updateSession } from "./proxy";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

/** Fake Supabase: getUser() can refresh the session by calling cookies.setAll like the real one. */
function mockSupabase(user: { id: string } | null, refreshed: CookieToSet[] = []) {
  vi.mocked(createServerClient).mockImplementation(((
    _url: string,
    _key: string,
    options: { cookies: { setAll: (c: CookieToSet[]) => void } }
  ) => ({
    auth: {
      getUser: async () => {
        if (refreshed.length) options.cookies.setAll(refreshed);
        return { data: { user } };
      },
    },
  })) as never);
}

const req = (path: string) => new NextRequest(`http://localhost:3000${path}`);
const location = (res: Response) => res.headers.get("location");

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "k");
});
afterEach(() => vi.unstubAllEnvs());

describe("updateSession — route protection", () => {
  it.each(["/dashboard", "/dashboard/settings"])(
    "AUTH-AC-12: guest visiting %s is redirected to /login",
    async (path) => {
      mockSupabase(null);
      const res = await updateSession(req(path));
      expect(res.status).toBe(307);
      expect(location(res)).toBe("http://localhost:3000/login");
    }
  );

  it("AUTH-AC-12: signed-in user visiting /dashboard proceeds", async () => {
    mockSupabase({ id: "u1" });
    const res = await updateSession(req("/dashboard"));
    expect(location(res)).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(["/", "/login"])("AUTH-AC-12: public page %s is not blocked for guests", async (path) => {
    mockSupabase(null);
    const res = await updateSession(req(path));
    expect(location(res)).toBeNull();
  });
});

describe("updateSession — session refresh", () => {
  const fresh: CookieToSet[] = [{ name: "sb-access-token", value: "fresh", options: { path: "/" } }];

  it("GGL-AC-08: new session cookies are attached to the response", async () => {
    mockSupabase({ id: "u1" }, fresh);
    const res = await updateSession(req("/dashboard"));
    expect(res.cookies.get("sb-access-token")?.value).toBe("fresh");
  });

  it("GGL-AC-08: forwarded request also gets the new cookies so server components can read them", async () => {
    mockSupabase({ id: "u1" }, fresh);
    const request = req("/dashboard");
    await updateSession(request);
    expect(request.cookies.get("sb-access-token")?.value).toBe("fresh");
  });

  it("GGL-AC-08: new cookies are kept when the request is redirected", async () => {
    mockSupabase(null, fresh);
    const res = await updateSession(req("/dashboard"));
    expect(location(res)).toBe("http://localhost:3000/login");
    expect(res.cookies.get("sb-access-token")?.value).toBe("fresh");
  });
});

describe("updateSession — locale", () => {
  it("I18N-AC-06: guest visiting /en/dashboard is redirected to /en/login", async () => {
    mockSupabase(null);
    const res = await updateSession(req("/en/dashboard"));
    expect(location(res)).toBe("http://localhost:3000/en/login");
  });

  it("I18N-AC-07: signed-in user visiting /en/dashboard proceeds", async () => {
    mockSupabase({ id: "u1" });
    const res = await updateSession(req("/en/dashboard"));
    expect(location(res)).toBeNull();
  });
});
