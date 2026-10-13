import { vi } from "vitest";

import type { RoleReader } from "@/modules/admin/application/role-reader";
import type { AuthService } from "@/modules/auth/application/auth-service";
import type { CreditStore } from "@/modules/credits/application/credit-store";
import type { PointsStore } from "@/modules/points/application/points-store";
import type { SentenceProgressStore } from "@/modules/writing/application/sentence-progress-store";
import type { SentenceGrader } from "@/modules/writing/application/sentence-grader";
import type { SentenceGrade } from "@/modules/writing/domain/sentence-grade";
import type { PromptRepository } from "@/modules/writing/application/prompt-repository";
import type { ReferenceAnswerSource } from "@/modules/writing/application/reference-answer-source";
import type { AcceptedAnswer } from "@/modules/writing/domain/accepted-answer";
import type { Prompt } from "@/modules/writing/domain/prompt";

/** Fake AuthService: every method is vi.fn(), overridden per test. */
export function fakeAuth(overrides: Partial<AuthService> = {}): AuthService {
  return {
    getCurrentUser: vi.fn().mockResolvedValue(null),
    signInWithPassword: vi.fn().mockResolvedValue(undefined),
    signUpWithPassword: vi.fn().mockResolvedValue({ needsEmailConfirmation: false }),
    resendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    getOAuthSignInUrl: vi.fn().mockResolvedValue("https://accounts.google.com/o/oauth2/v2/auth?x=1"),
    exchangeCodeForSession: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export const ADMIN_USER = { id: "admin-1", email: "admin@verba.test" };

/** Fake RoleReader: everyone is an admin unless told otherwise. */
export function fakeRoles(isAdmin = true): RoleReader {
  return { isAdmin: vi.fn().mockResolvedValue(isAdmin) };
}

export function samplePrompt(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    level: "beginner",
    category: "food-drink",
    vietnamese: "Tôi thích ăn phở.",
    hint: "like, pho",
    published: false,
    answers: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

/** Fake PromptRepository: every method is vi.fn(), overridden per test. */
export function fakePromptRepo(overrides: Partial<PromptRepository> = {}): PromptRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    findById: vi.fn().mockResolvedValue(samplePrompt()),
    create: vi.fn().mockImplementation(async (draft) => samplePrompt({ ...draft })),
    update: vi.fn().mockImplementation(async (_id, draft) => samplePrompt({ ...draft })),
    remove: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

/** Fake CreditStore with a fixed balance; `spend` follows the real contract (null when too low). */
export function fakeCredits(balance = 100, overrides: Partial<CreditStore> = {}): CreditStore {
  return {
    balance: vi.fn().mockResolvedValue(balance),
    spend: vi.fn().mockImplementation(async (amount: number) => (balance >= amount ? balance - amount : null)),
    ...overrides,
  };
}

export function sampleGrade(overrides: Partial<SentenceGrade> = {}): SentenceGrade {
  return {
    correct: false,
    suggestion: "I want to go to the beach.",
    improvements: ["Thiếu động từ go."],
    comment: "Bạn đã dùng đúng I want to.",
    ...overrides,
  };
}

/** Fake SentenceGrader that always returns `grade`. */
export function fakeGrader(grade: SentenceGrade = sampleGrade()): SentenceGrader {
  return { grade: vi.fn().mockResolvedValue(grade) };
}

/** Fake SentenceProgressStore: `done` are the ids the user already completed. */
export function fakeProgress(done: string[] = [], overrides: Partial<SentenceProgressStore> = {}): SentenceProgressStore {
  return {
    completedIds: vi.fn().mockResolvedValue(new Set(done)),
    completedByCategory: vi.fn().mockResolvedValue({}),
    markCompleted: vi.fn().mockResolvedValue({ awarded: 10, totalPoints: 10 }),
    ...overrides,
  };
}

/** Fake PointsStore with a fixed total. */
export function fakePoints(total = 0): PointsStore {
  return { total: vi.fn().mockResolvedValue(total) };
}

/** Fake ReferenceAnswerSource returning the same accepted answers for every prompt. */
export function fakeReferences(answers: AcceptedAnswer[] = []): ReferenceAnswerSource {
  return { find: vi.fn().mockResolvedValue(answers) };
}
