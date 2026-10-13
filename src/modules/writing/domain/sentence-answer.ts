export const MAX_ANSWER_LENGTH = 300;

/** An answer can be submitted when it has content and fits the length limit (measured after trimming). */
export function canSubmitAnswer(text: string): boolean {
  const length = text.trim().length;
  return length > 0 && length <= MAX_ANSWER_LENGTH;
}
