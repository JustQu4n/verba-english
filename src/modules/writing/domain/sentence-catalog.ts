/** Levels in ascending order of difficulty. */
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

/** Fixed topic list. Display names live in the message files, keyed by these ids. */
export const CATEGORIES = [
  "personal-communication",
  "everyday-life",
  "transportation-travel",
  "school-education",
  "work-business",
  "public-services",
  "health-medicine",
  "shopping-money",
  "food-drink",
  "entertainment-leisure",
  "nature-environment",
  "science-technology",
  "culture-society",
  "government-politics",
  "history-geography",
  "sports-fitness",
  "arts-literature",
  "religion-spirituality",
  "law-justice",
  "philosophy-ethics",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface SentenceSelection {
  readonly level: Level;
  readonly category: Category;
}

/** A Vietnamese sentence the learner translates into English, plus English key words as a hint. */
export interface SentencePrompt extends SentenceSelection {
  readonly id: string;
  readonly vietnamese: string;
  readonly hint: string;
}

export const isLevel = (value: unknown): value is Level =>
  typeof value === "string" && (LEVELS as readonly string[]).includes(value);

export const isCategory = (value: unknown): value is Category =>
  typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
