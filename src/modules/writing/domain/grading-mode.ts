/** How the learner wants the answer checked: by the AI, or only against the accepted answers of the prompt. */
export const GRADING_MODES = ["ai", "reference"] as const;
export type GradingMode = (typeof GRADING_MODES)[number];

export const DEFAULT_GRADING_MODE: GradingMode = "ai";
