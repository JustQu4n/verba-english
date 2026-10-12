import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt, used by Supabase, ignores everything after 72 bytes. */
export const PASSWORD_MAX_LENGTH = 72;
export const FULL_NAME_MAX_LENGTH = 80;

const email = z
  .string({ error: "email_invalid" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "email_invalid" }));

/** Sign-in only requires a password: older accounts may predate the strength rules. */
export const signInSchema = z.object({
  email,
  password: z.string({ error: "password_required" }).min(1, "password_required"),
});

const newPassword = z
  .string({ error: "password_required" })
  .min(PASSWORD_MIN_LENGTH, "password_too_short")
  .max(PASSWORD_MAX_LENGTH, "password_too_long")
  .refine((value) => /\p{L}/u.test(value) && /\d/.test(value), "password_weak");

export const signUpSchema = z.object({
  fullName: z
    .string({ error: "name_required" })
    .trim()
    .min(1, "name_required")
    .max(FULL_NAME_MAX_LENGTH, "name_too_long"),
  email,
  password: newPassword,
});

export const emailOnlySchema = z.object({ email });

export type Credentials = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
