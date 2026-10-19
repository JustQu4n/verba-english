import type { GradeCache } from "../application/grade-cache";
import type { SentenceGrade } from "../domain/sentence-grade";

/**
 * A fast cache in front of a shared one. A hit in the shared cache is copied to the fast one, so a busy server
 * instance asks the database once per grade. Writes go to both.
 */
export class LayeredGradeCache implements GradeCache {
  private readonly fast: GradeCache;
  private readonly shared: GradeCache;

  constructor(fast: GradeCache, shared: GradeCache) {
    this.fast = fast;
    this.shared = shared;
  }

  async get(key: string): Promise<SentenceGrade | undefined> {
    const near = await this.fast.get(key);
    if (near) return near;
    const far = await this.shared.get(key);
    if (far) await this.fast.set(key, far);
    return far;
  }

  async set(key: string, grade: SentenceGrade): Promise<void> {
    await this.fast.set(key, grade);
    await this.shared.set(key, grade);
  }
}
