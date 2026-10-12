import { redirect } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InfrastructureError, NotFoundError, UnauthorizedError, ValidationError } from "@/core/errors";

import { handle, toErrorResponse } from "./http";

afterEach(() => vi.restoreAllMocks());

async function body(res: Response) {
  return res.json() as Promise<{ error: { code: string; message: string } }>;
}

describe("toErrorResponse", () => {
  it("CORE-AC-03: ValidationError → 400 with code and message", async () => {
    const res = toErrorResponse(new ValidationError("Sai email"));
    expect(res.status).toBe(400);
    expect(await body(res)).toEqual({
      error: { code: "VALIDATION_ERROR", message: "Sai email" },
    });
  });

  it("CORE-AC-04: UnauthorizedError → 401", () => {
    expect(toErrorResponse(new UnauthorizedError("x")).status).toBe(401);
  });

  it("CORE-AC-05: NotFoundError → 404", () => {
    expect(toErrorResponse(new NotFoundError("x")).status).toBe(404);
  });

  it("CORE-AC-06: infrastructure and unknown errors → 500, original message not leaked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const error of [new InfrastructureError("SELECT * FROM secret"), new Error("boom")]) {
      const res = toErrorResponse(error);
      const json = await body(res);
      expect(res.status).toBe(500);
      expect(json.error.message).toBe("Something went wrong");
      expect(JSON.stringify(json)).not.toMatch(/secret|boom/);
    }
  });
});

describe("handle", () => {
  it("CORE-AC-09: catches errors thrown by the handler and responds per the error mapping", async () => {
    const handler = handle(async () => {
      throw new UnauthorizedError("You are not signed in");
    });
    const res = await handler();
    expect(res.status).toBe(401);
  });

  it("CORE-AC-09: keeps the response unchanged when the handler succeeds", async () => {
    const handler = handle(async (n: number) => new Response(String(n), { status: 201 }));
    const res = await handler(7);
    expect(res.status).toBe(201);
    expect(await res.text()).toBe("7");
  });

  it("CORE-AC-10: Next control-flow errors (redirect) are rethrown, not turned into 500", async () => {
    const handler = handle(async () => redirect("/login"));
    await expect(handler()).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
  });
});
