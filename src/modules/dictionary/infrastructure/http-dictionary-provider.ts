import { InfrastructureError } from "@/core/errors";

import type { DictionaryProvider } from "../application/ports";
import type { DictionaryEntry } from "../domain/dictionary-entry";
import { parseLookupResponse } from "./dictionary-response";

const TIMEOUT_MS = 5000;

/** Calls the dictionary service (`lang=en`, definitions in Vietnamese). */
export class HttpDictionaryProvider implements DictionaryProvider {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(baseUrl: string, fetcher: typeof fetch = fetch) {
    this.baseUrl = baseUrl;
    this.fetcher = fetcher;
  }

  async lookup(word: string): Promise<DictionaryEntry | null> {
    const url = new URL("/api/v1/lookup", this.baseUrl);
    url.search = new URLSearchParams({ word, lang: "en", def_lang: "vi" }).toString();

    let response: Response;
    try {
      response = await this.fetcher(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    } catch (error) {
      throw new InfrastructureError("Could not reach the dictionary", { cause: error });
    }
    if (response.status === 404) return null;
    if (!response.ok) throw new InfrastructureError(`The dictionary answered ${response.status}`);

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      throw new InfrastructureError("The dictionary answer could not be read", { cause: error });
    }
    return parseLookupResponse(body, this.baseUrl);
  }
}
