export interface TextPart {
  text: string;
  bold: boolean;
}

/**
 * Splits text on `**bold**` markers so it can be rendered without injecting HTML.
 * An unpaired marker is dropped and the rest stays plain.
 */
export function splitBold(text: string): TextPart[] {
  const pieces = text.split("**");
  // An odd number of markers leaves the last piece open: treat it as plain text.
  const closed = pieces.length % 2 === 1 ? pieces.length : pieces.length - 1;
  const parts: TextPart[] = [];
  pieces.forEach((piece, index) => {
    if (!piece) return;
    parts.push({ text: piece, bold: index % 2 === 1 && index < closed });
  });
  return parts;
}
