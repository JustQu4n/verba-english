/** One piece of the learner's answer, marked against the suggested sentence. */
export type DiffPart =
  /** Words that are right as written. */
  | { kind: "same"; text: string }
  /** Words to change or drop (`fix` is what should stand there, empty when the words are just extra). */
  | { kind: "wrong"; text: string; fix: string }
  /** Words missing from the answer. */
  | { kind: "missing"; text: string };

/** Words compare without case or edge punctuation, so "Beach." matches "beach". */
function key(word: string): string {
  return word.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Longest common subsequence table, filled from the end so the walk below runs forwards. */
function lcsTable(a: string[], b: string[]): number[][] {
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

/**
 * Compares the learner's answer with the suggested sentence word by word. Words only in the answer are `wrong`
 * (with the suggested words that stand in their place as `fix`); words only in the suggestion are `missing`.
 * Joining the `same` and `wrong` texts gives back the answer.
 */
export function diffAnswer(answer: string, suggestion: string): DiffPart[] {
  const mine = words(answer);
  const target = words(suggestion);
  const table = lcsTable(mine.map(key), target.map(key));
  const a = mine.map(key);
  const b = target.map(key);

  const parts: DiffPart[] = [];
  let wrong: string[] = [];
  let fix: string[] = [];

  const flush = () => {
    if (wrong.length > 0) parts.push({ kind: "wrong", text: wrong.join(" "), fix: fix.join(" ") });
    else if (fix.length > 0) parts.push({ kind: "missing", text: fix.join(" ") });
    wrong = [];
    fix = [];
  };

  let i = 0;
  let j = 0;
  while (i < mine.length || j < target.length) {
    if (i < mine.length && j < target.length && a[i] === b[j]) {
      flush();
      const last = parts[parts.length - 1];
      if (last?.kind === "same") last.text += ` ${mine[i]}`;
      else parts.push({ kind: "same", text: mine[i] });
      i++;
      j++;
    } else if (j >= target.length || (i < mine.length && table[i + 1][j] >= table[i][j + 1])) {
      wrong.push(mine[i++]);
    } else {
      fix.push(target[j++]);
    }
  }
  flush();
  return parts;
}
