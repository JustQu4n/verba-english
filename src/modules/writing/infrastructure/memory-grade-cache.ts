import type { GradeCache } from "../application/grade-cache";
import type { SentenceGrade } from "../domain/sentence-grade";

interface Entry {
  grade: SentenceGrade;
  expiresAt: number;
}

const DEFAULT_MAX_ENTRIES = 500;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Small in-memory cache. It lives in one server process, so it is a best-effort saver of AI quota,
 * not a source of truth: a cold start or another instance simply grades again.
 */
export class MemoryGradeCache implements GradeCache {
  private readonly entries = new Map<string, Entry>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor({ maxEntries = DEFAULT_MAX_ENTRIES, ttlMs = DEFAULT_TTL_MS, now = Date.now } = {}) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.now = now;
  }

  async get(key: string): Promise<SentenceGrade | undefined> {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    // Re-insert so the most recently used key is the last one (Map keeps insertion order).
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.grade;
  }

  async set(key: string, grade: SentenceGrade): Promise<void> {
    this.entries.delete(key);
    this.entries.set(key, { grade, expiresAt: this.now() + this.ttlMs });
    if (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }
}
