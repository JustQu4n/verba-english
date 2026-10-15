import { describe, expect, it } from "vitest";

import { FEEDBACK_LANGUAGE } from "./sentence-grade";

describe("FEEDBACK_LANGUAGE", () => {
  it("AIG-AC-23: AI feedback is always in Vietnamese, whatever the interface language", () => {
    expect(FEEDBACK_LANGUAGE).toBe("vi");
  });
});
