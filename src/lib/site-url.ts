/** Base URL of the app (differs between local and production). */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return (configured || "http://localhost:3000").replace(/\/+$/, "");
}
