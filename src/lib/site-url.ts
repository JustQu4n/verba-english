/** Base URL of the app from configuration (differs between local and production). */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return (configured || "http://localhost:3000").replace(/\/+$/, "");
}

interface HeaderReader {
  get(name: string): string | null;
}

/** Letters, digits, dots and dashes with an optional port: rejects paths, queries and userinfo. */
const HOST_PATTERN = /^[a-z0-9.-]+(:\d{1,5})?$/i;
const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1)(:\d+)?$/i;

const firstValue = (value: string | null) => value?.split(",")[0]?.trim() || null;

/**
 * Base URL of the current request. Preferred over the configured value for OAuth redirects:
 * a production deploy whose NEXT_PUBLIC_SITE_URL was missing at build time would otherwise
 * send users back to http://localhost:3000. Supabase still checks the result against its
 * Redirect URLs allow-list, so a forged Host header cannot redirect anywhere unlisted.
 */
export function resolveSiteUrl(headers: HeaderReader): string {
  const host = firstValue(headers.get("x-forwarded-host")) ?? firstValue(headers.get("host"));
  if (!host || !HOST_PATTERN.test(host)) return getSiteUrl();

  const forwardedProto = firstValue(headers.get("x-forwarded-proto"))?.toLowerCase();
  const protocol =
    forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : LOCAL_HOST_PATTERN.test(host)
        ? "http"
        : "https";
  return `${protocol}://${host}`;
}
