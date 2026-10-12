const DEFAULT_PATH = "/dashboard";
const FAKE_ORIGIN = "http://localhost";

/**
 * Only accepts internal app paths to prevent open redirects.
 * Any other value (absolute URL, `//host`, `/\host`, control characters...) falls back to `fallback`.
 */
export function safeNextPath(next: string | null | undefined, fallback = DEFAULT_PATH): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  try {
    // The URL parser strips tabs/newlines so "/\t/evil.com" becomes "//evil.com": check the origin after parsing.
    const url = new URL(next, FAKE_ORIGIN);
    if (url.origin !== FAKE_ORIGIN) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
