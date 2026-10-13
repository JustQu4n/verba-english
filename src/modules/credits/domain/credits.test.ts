import { describe, expect, it } from "vitest";

import { GRADING_COST, INITIAL_CREDITS } from "./credits";

describe("credits", () => {
  it("AIG-AC-01: a new account has 100 credits and one grading costs 1", () => {
    expect(INITIAL_CREDITS).toBe(100);
    expect(GRADING_COST).toBe(1);
  });
});
