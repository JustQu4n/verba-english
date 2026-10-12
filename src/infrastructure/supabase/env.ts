import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  // Supabase renamed the anon key to publishable key; the old name is still supported.
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

/**
 * Must reference process.env.NEXT_PUBLIC_* by static name so Next.js
 * inlines the value into the browser bundle.
 */
export function getSupabaseEnv() {
  const parsed = schema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Missing or invalid Supabase environment variables: ${missing}. Check the .env file, then restart \`npm run dev\`.`
    );
  }

  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    key: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}
