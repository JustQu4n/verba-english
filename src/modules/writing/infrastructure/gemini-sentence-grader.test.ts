import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { GeminiSentenceGrader } from "./gemini-sentence-grader";

const request = { vietnamese: "Tôi muốn đi biển.", level: "beginner", answer: "I want to the beach", language: "en" } as const;
const grade = { correct: false, suggestion: "I want to go to the beach.", improvements: ["Thiếu go."], comment: "Gần đúng." };
const SECRET = "AIza-secret-key";

const interactionReply = (text: string, status = "completed") => ({
  status,
  steps: [
    { type: "user_input", content: [{ type: "text", text: "ignored" }] },
    { type: "model_output", content: [{ type: "text", text }] },
  ],
});

function grader(response: unknown, init: { ok?: boolean; status?: number; apiKey?: string | undefined } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => response,
  });
  const apiKey = "apiKey" in init ? init.apiKey : SECRET;
  return {
    fetchMock,
    grader: new GeminiSentenceGrader({ apiKey, model: "m-1", thinkingLevel: "minimal", fetch: fetchMock as never }),
  };
}

describe("GeminiSentenceGrader", () => {
  it("AIG-AC-11: sends the key in a header and a cheap, structured, unstored request", async () => {
    const { grader: g, fetchMock } = grader(interactionReply(JSON.stringify(grade)));
    await g.grade(request);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    expect(String(url)).not.toContain(SECRET);
    expect(init.headers["x-goog-api-key"]).toBe(SECRET);
    expect(init.body).not.toContain(SECRET);

    const body = JSON.parse(init.body);
    expect(body.model).toBe("m-1");
    expect(body.store).toBe(false);
    expect(body.generation_config).toEqual({ max_output_tokens: 600, thinking_level: "minimal" });
    expect(body.response_format).toMatchObject({ type: "text", mime_type: "application/json" });
    expect(body.input).toContain("<answer>I want to the beach</answer>");
    expect(body.input).toContain("Feedback language: English");
    expect(body.system_instruction).toEqual(expect.any(String));
  });

  it("AIG-AC-12: reads the grade from the model output step", async () => {
    const { grader: g } = grader(interactionReply(JSON.stringify(grade)));
    await expect(g.grade(request)).resolves.toEqual(grade);
  });

  it("AIG-AC-12: also reads the generateContent reply shape", async () => {
    const reply = { candidates: [{ content: { parts: [{ text: JSON.stringify(grade) }] } }] };
    await expect(grader(reply).grader.grade(request)).resolves.toEqual(grade);
  });

  it.each([
    ["an unfinished interaction", interactionReply(JSON.stringify(grade), "incomplete")],
    ["no model output", { status: "completed", steps: [] }],
    ["text that is not a grade", interactionReply("sorry, I cannot")],
    ["a body that is not an object", "oops"],
    ["a null body", null],
  ])("AIG-AC-12: %s is an infrastructure error", async (_name, reply) => {
    await expect(grader(reply).grader.grade(request)).rejects.toBeInstanceOf(InfrastructureError);
  });

  it("AIG-AC-12: an HTTP error reports only the status, never the body", async () => {
    const { grader: g } = grader({ error: { message: `bad key ${SECRET} for I want to the beach` } }, { ok: false, status: 429 });
    const promise = g.grade(request);
    await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(promise).rejects.toThrow("status 429");
    await expect(promise).rejects.not.toThrow(/beach|secret/);
  });

  it("AIG-AC-12: a network failure or timeout is an infrastructure error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("socket hang up"));
    const g = new GeminiSentenceGrader({ apiKey: SECRET, model: "m", thinkingLevel: "minimal", fetch: fetchMock as never });
    await expect(g.grade(request)).rejects.toBeInstanceOf(InfrastructureError);
  });

  it("AIG-AC-12: an unreadable JSON body is an infrastructure error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => Promise.reject(new Error("bad")) });
    const g = new GeminiSentenceGrader({ apiKey: SECRET, model: "m", thinkingLevel: "minimal", fetch: fetchMock as never });
    await expect(g.grade(request)).rejects.toBeInstanceOf(InfrastructureError);
  });

  it("AIG-AC-13: without a key nothing goes over the network", async () => {
    const { grader: g, fetchMock } = grader(interactionReply("{}"), { apiKey: undefined });
    await expect(g.grade(request)).rejects.toBeInstanceOf(InfrastructureError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
