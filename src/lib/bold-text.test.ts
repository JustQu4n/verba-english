import { describe, expect, it } from "vitest";

import { splitBold } from "./bold-text";

describe("splitBold", () => {
  it("AIG-AC-32: marks the words between ** pairs", () => {
    expect(splitBold("Dùng **went** thay cho **goed**.")).toEqual([
      { text: "Dùng ", bold: false },
      { text: "went", bold: true },
      { text: " thay cho ", bold: false },
      { text: "goed", bold: true },
      { text: ".", bold: false },
    ]);
  });

  it("AIG-AC-32: plain text and unpaired markers stay plain", () => {
    expect(splitBold("không có gì")).toEqual([{ text: "không có gì", bold: false }]);
    expect(splitBold("mở **không đóng")).toEqual([
      { text: "mở ", bold: false },
      { text: "không đóng", bold: false },
    ]);
    expect(splitBold("")).toEqual([]);
  });
});
