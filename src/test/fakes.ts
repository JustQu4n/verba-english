import { vi } from "vitest";

import type { RoleReader } from "@/modules/admin/application/role-reader";
import type { UserDirectory } from "@/modules/admin/application/user-directory";
import type { UserAccount } from "@/modules/admin/domain/user-account";
import type { AuthService } from "@/modules/auth/application/auth-service";
import type { DictionaryCache, DictionaryProvider, SavedWordStore, WordTranslator } from "@/modules/dictionary/application/ports";
import type { DictionaryEntry } from "@/modules/dictionary/domain/dictionary-entry";
import type { CreditStore } from "@/modules/credits/application/credit-store";
import type { LeaderboardSource } from "@/modules/leaderboard/application/leaderboard-source";
import type { RankedLearner } from "@/modules/leaderboard/domain/leaderboard";
import type { AvatarStorage } from "@/modules/profile/application/avatar-storage";
import type { ProfileRepository } from "@/modules/profile/application/profile-repository";
import type { Profile } from "@/modules/profile/domain/profile";
import type { PointsStore } from "@/modules/points/application/points-store";
import type { AttemptStore } from "@/modules/writing/application/attempt-store";
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

/** Fake AttemptStore that records nothing and lists nothing. */
export function fakeAttempts(overrides: Partial<AttemptStore> = {}): AttemptStore {
  return {
    record: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    ...overrides,
  };
}

/** Fake LeaderboardSource with a fixed ranking. */
export function fakeLeaderboard(
  top: RankedLearner[] = [],
  standing: { rank: number; points: number } | null = null
): LeaderboardSource {
  return { top: vi.fn().mockResolvedValue(top), standing: vi.fn().mockResolvedValue(standing) };
}

export function sampleProfile(overrides: Partial<Profile> = {}): Profile {
  return { id: "u1", fullName: "Alex Lee", avatarUrl: null, accentColor: null, createdAt: new Date("2026-01-01T00:00:00.000Z"), ...overrides };
}

/** Fake ProfileRepository: `update` returns the profile with the patch applied. */
export function fakeProfiles(profile: Profile | null = sampleProfile(), overrides: Partial<ProfileRepository> = {}): ProfileRepository {
  return {
    findById: vi.fn().mockResolvedValue(profile),
    update: vi.fn().mockImplementation(async (_id, patch) => ({ ...(profile ?? sampleProfile()), ...patch })),
    ...overrides,
  };
}

/** Fake AvatarStorage that "stores" every picture at a fixed public address. */
export function fakeAvatars(overrides: Partial<AvatarStorage> = {}): AvatarStorage {
  return {
    upload: vi.fn().mockResolvedValue("https://files.test/storage/v1/object/public/avatars/u1/new.webp"),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function sampleAccount(overrides: Partial<UserAccount> = {}): UserAccount {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    email: "learner@verba.test",
    fullName: "Learner",
    avatarUrl: null,
    role: "user",
    points: 40,
    credits: 10,
    createdAt: new Date("2026-02-01T00:00:00.000Z"),
    lastSignInAt: null,
    rank: 3,
    ...overrides,
  };
}

/** Fake UserDirectory: `update` returns the account with the patch applied. */
export function fakeUsers(account: UserAccount | null = sampleAccount(), overrides: Partial<UserDirectory> = {}): UserDirectory {
  return {
    list: vi.fn().mockResolvedValue({ items: account ? [account] : [], total: account ? 1 : 0 }),
    find: vi.fn().mockResolvedValue(account),
    update: vi.fn().mockImplementation(async (_id, patch) => (account ? { ...account, ...patch } : null)),
    overview: vi.fn().mockResolvedValue({
      users: 5, admins: 1, newUsers7d: 2, rankedLearners: 3, pointsTotal: 120, promptsPublished: 4, promptsDraft: 1, attempts: 9, completions: 7,
    }),
    ...overrides,
  };
}

export function sampleEntry(overrides: Partial<DictionaryEntry> = {}): DictionaryEntry {
  return {
    word: "convenient",
    ipa: "/kən\u02c8vi\u02d0.ni.ənt/",
    audioUrl: "https://dict.test/api/v1/tts?word=convenient&lang=en",
    meanings: [{ definition: "Thuận tiện, tiện lợi.", pos: "Tính từ", example: null, vietnamese: true }],
    source: "dictionary",
    ...overrides,
  };
}

export function fakeDictionaryProvider(entry: DictionaryEntry | null = sampleEntry(), overrides: Partial<DictionaryProvider> = {}): DictionaryProvider {
  return { lookup: vi.fn().mockResolvedValue(entry), ...overrides };
}

/** `entry` is what the cache remembers: undefined means nothing is cached, null a cached "not found". */
export function fakeDictionaryCache(entry: DictionaryEntry | null | undefined = undefined, overrides: Partial<DictionaryCache> = {}): DictionaryCache {
  return {
    get: vi.fn().mockResolvedValue(entry === undefined ? undefined : { entry }),
    put: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function fakeSavedWords(overrides: Partial<SavedWordStore> = {}): SavedWordStore {
  return {
    list: vi.fn().mockResolvedValue([]),
    has: vi.fn().mockResolvedValue(false),
    save: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function fakeTranslator(entry: DictionaryEntry = sampleEntry({ source: "ai" }), overrides: Partial<WordTranslator> = {}): WordTranslator {
  return { translate: vi.fn().mockImplementation(async (word: string) => ({ ...entry, word })), ...overrides };
}
