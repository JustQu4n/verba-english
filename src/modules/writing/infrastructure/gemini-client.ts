import { InfrastructureError } from "@/core/errors";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const TIMEOUT_MS = 20_000;

export interface GeminiOptions {
  /** Server-only key. When missing, calls fail with an infrastructure error instead of going out. */
  apiKey: string | undefined;
  model: string;
  /** Lowest reasoning level the model accepts: thinking tokens are billed. */
  thinkingLevel: string;
  fetch?: typeof fetch;
}

export interface JsonRequest {
  system: string;
  input: string;
  /** JSON Schema of the reply. */
  schema: object;
  /** Cap on the reply; leaves room for a little thinking without allowing a runaway answer. */
  maxOutputTokens: number;
}

interface Part {
  type?: string;
  text?: string;
}

/** Pulls the model's text out of an Interactions reply (steps) or a generateContent reply (candidates). */
function extractText(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const { steps, candidates, status } = body as {
    steps?: { type?: string; content?: Part[] }[];
    candidates?: { content?: { parts?: Part[] } }[];
    status?: string;
  };
  if (status !== undefined && status !== "completed") return null;
  const parts: Part[] = Array.isArray(steps)
    ? steps.filter((s) => s?.type === "model_output").flatMap((s) => s.content ?? [])
    : (candidates?.[0]?.content?.parts ?? []);
  const text = parts
    .filter((p) => p?.type === undefined || p.type === "text")
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join("");
  return text.trim() === "" ? null : text;
}

/** One short Gemini call through the Interactions API: JSON text back, nothing stored on Google's side. */
export async function generateJson({ apiKey, model, thinkingLevel, fetch: fetchImpl }: GeminiOptions, request: JsonRequest): Promise<string> {
  if (!apiKey) throw new InfrastructureError("Gemini is not configured");

  let response: Response;
  try {
    response = await (fetchImpl ?? fetch)(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        system_instruction: request.system,
        input: request.input,
        store: false,
        generation_config: { max_output_tokens: request.maxOutputTokens, thinking_level: thinkingLevel },
        response_format: { type: "text", mime_type: "application/json", schema: request.schema },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new InfrastructureError("Gemini request failed", { cause: error });
  }

  // Only the status is reported: the body can echo the request, which may hold the learner's text.
  if (!response.ok) throw new InfrastructureError(`Gemini answered with status ${response.status}`);

  const text = extractText(await response.json().catch(() => null));
  if (text === null) throw new InfrastructureError("Gemini returned an unusable reply");
  return text;
}
