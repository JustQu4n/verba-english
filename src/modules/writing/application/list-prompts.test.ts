import { describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakePromptRepo, fakeRoles, samplePrompt } from "@/test/fakes";

import { listPrompts, PAGE_SIZE } from "./list-prompts";

function setup(total = 45) {
  const prompts = fakePromptRepo({
    list: vi.fn().mockResolvedValue({ items: [samplePrompt()], total }),
  });
  const deps = {
    auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(ADMIN_USER) }),
    roles: fakeRoles(true),
    prompts,
  };
  return { prompts, deps };
}

describe("listPrompts", () => {
  it("APR-AC-10: applies defaults when no filter is given", async () => {
    const { prompts, deps } = setup();
    await listPrompts(deps, {});
    expect(PAGE_SIZE).toBe(20);
    expect(prompts.list).toHaveBeenCalledWith({
      level: undefined,
      category: undefined,
      status: "all",
      query: undefined,
      page: 1,
      pageSize: 20,
    });
  });

  it("APR-AC-10: passes normalized filters from query-string values", async () => {
    const { prompts, deps } = setup();
    await listPrompts(deps, { level: "advanced", category: "law-justice", status: "draft", query: "  luật ", page: "3" });
    expect(prompts.list).toHaveBeenCalledWith({
      level: "advanced",
      category: "law-justice",
      status: "draft",
      query: "luật",
      page: 3,
      pageSize: 20,
    });
  });

  it("APR-AC-10: treats empty filter values as not set", async () => {
    const { prompts, deps } = setup();
    await listPrompts(deps, { level: "", category: "", status: "", query: "   " });
    expect(prompts.list).toHaveBeenCalledWith(
      expect.objectContaining({ level: undefined, category: undefined, status: "all", query: undefined })
    );
  });

  it.each(["0", "-4", "abc", "2.5", ""])("APR-AC-10: falls back to page 1 for page %j", async (page) => {
    const { prompts, deps } = setup();
    await listPrompts(deps, { page });
    expect(prompts.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });

  it.each<Record<string, string>>([{ level: "expert" }, { category: "cooking" }, { status: "deleted" }])(
    "APR-AC-10: rejects an out-of-catalog filter %j",
    async (filter) => {
      const { prompts, deps } = setup();
      await expect(listPrompts(deps, filter)).rejects.toBeInstanceOf(ValidationError);
      expect(prompts.list).not.toHaveBeenCalled();
    }
  );

  it("APR-AC-10: returns the items together with the page count", async () => {
    const { deps } = setup(45);
    const result = await listPrompts(deps, { page: "2" });
    expect(result).toMatchObject({ total: 45, page: 2, pageSize: 20, pageCount: 3 });
    expect(result.items).toHaveLength(1);
  });

  it("APR-AC-10: reports at least one page when empty", async () => {
    const { deps } = setup(0);
    await expect(listPrompts(deps, {})).resolves.toMatchObject({ total: 0, pageCount: 1 });
  });
});
