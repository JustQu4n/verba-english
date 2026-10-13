import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import { fakeAuth, fakePoints } from "@/test/fakes";

import { getPoints } from "./get-points";

describe("getPoints", () => {
  it("PTS-AC-04: returns the points of the signed-in user", async () => {
    const points = fakePoints(70);
    const auth = fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.c" }) });
    await expect(getPoints({ auth, points })).resolves.toBe(70);
    expect(points.total).toHaveBeenCalledWith("u1");
  });

  it("PTS-AC-04: a guest is unauthorized and nothing is read", async () => {
    const points = fakePoints();
    await expect(getPoints({ auth: fakeAuth(), points })).rejects.toBeInstanceOf(UnauthorizedError);
    expect(points.total).not.toHaveBeenCalled();
  });
});
