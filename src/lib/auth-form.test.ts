import { describe, expect, it } from "vitest";

import { readSignInForm, readSignUpForm } from "./auth-form";

const form = (values: Record<string, string>) => {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
};

const valid = { fullName: "Alex Lee", email: "a@b.com", password: "abcdef12", confirmPassword: "abcdef12" };

describe("readSignUpForm", () => {
  it("EML-AC-10: accepts matching passwords and returns the input for the use case", () => {
    expect(readSignUpForm(form(valid))).toMatchObject({
      ok: true,
      input: { fullName: "Alex Lee", email: "a@b.com", password: "abcdef12" },
    });
  });

  it("EML-AC-10: different passwords → password_mismatch on the confirm field, no input returned", () => {
    const result = readSignUpForm(form({ ...valid, confirmPassword: "abcdef13" }));
    expect(result).toMatchObject({ ok: false, errors: { fieldErrors: { confirmPassword: "password_mismatch" } } });
    expect(result).not.toHaveProperty("input");
  });

  it("EML-AC-10: reports every invalid field at once", () => {
    const result = readSignUpForm(form({ fullName: "", email: "x", password: "1", confirmPassword: "2" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors.fieldErrors ?? {}).sort()).toEqual(["confirmPassword", "email", "fullName", "password"]);
    }
  });

  it("EML-AC-12: keeps the typed name and email (never the password) so the form can be refilled", () => {
    const result = readSignUpForm(form({ ...valid, password: "x", confirmPassword: "x" }));
    expect(result.values).toEqual({ fullName: "Alex Lee", email: "a@b.com" });
  });

  it("EML-AC-10: missing fields are treated as empty", () => {
    const result = readSignUpForm(new FormData());
    expect(result.ok).toBe(false);
  });
});

describe("readSignInForm", () => {
  it("EML-AC-05: returns the credentials as typed; validation stays in the use case", () => {
    expect(readSignInForm(form({ email: " A@b.com ", password: "abc" }))).toEqual({
      input: { email: " A@b.com ", password: "abc" },
      values: { email: " A@b.com " },
    });
  });
});
