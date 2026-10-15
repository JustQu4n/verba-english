import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { SupabaseAvatarStorage } from "./supabase-avatar-storage";

const BASE = "https://abc.supabase.co/storage/v1/object/public/avatars/";

function storage(options: { uploadError?: unknown; removeError?: unknown } = {}) {
  const upload = vi.fn().mockResolvedValue({ error: options.uploadError ?? null });
  const remove = vi.fn().mockResolvedValue({ error: options.removeError ?? null });
  const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `${BASE}${path}` } }));
  const from = vi.fn(() => ({ upload, remove, getPublicUrl }));
  return { avatars: new SupabaseAvatarStorage({ storage: { from } } as unknown as SupabaseClient), from, upload, remove };
}

const image = { bytes: new Uint8Array([1, 2, 3]), type: "image/webp" } as const;

describe("SupabaseAvatarStorage", () => {
  it("PRP-AC-10: uploads into the user's own folder under a fresh name and returns the public address", async () => {
    const { avatars, from, upload } = storage();
    const url = await avatars.upload("u1", image);
    expect(from).toHaveBeenCalledWith("avatars");
    const [path, bytes, options] = upload.mock.calls[0];
    expect(path).toMatch(/^u1\/[0-9a-f-]{36}\.webp$/);
    expect(bytes).toBe(image.bytes);
    expect(options).toMatchObject({ contentType: "image/webp", upsert: false });
    expect(url).toBe(`${BASE}${path}`);
    const second = await avatars.upload("u1", image);
    expect(second).not.toBe(url);
  });

  it("PRP-AC-10: a storage error is an infrastructure error without its message", async () => {
    const promise = storage({ uploadError: { message: "bucket secret-name not found" } }).avatars.upload("u1", image);
    await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(promise).rejects.not.toThrow(/secret-name/);
  });

  it("PRP-AC-11: deletes only a file in the user's own folder of this bucket", async () => {
    const { avatars, remove } = storage();
    await avatars.remove("u1", `${BASE}u1/a.webp?t=1`);
    expect(remove).toHaveBeenCalledWith(["u1/a.webp"]);
  });

  it.each([
    ["another user's file", `${BASE}u2/a.webp`],
    ["a path trying to climb out", `${BASE}u1/..%2Fu2/a.webp`],
    ["a nested path", `${BASE}u1/x/a.webp`],
    ["a Google photo", "https://lh3.googleusercontent.com/a/photo"],
    ["another bucket", "https://abc.supabase.co/storage/v1/object/public/other/u1/a.webp"],
    ["a broken escape", `${BASE}u1/%E0%A4%A`],
  ])("PRP-AC-11: %s is left alone", async (_name, url) => {
    const { avatars, remove } = storage();
    await avatars.remove("u1", url);
    expect(remove).not.toHaveBeenCalled();
  });

  it("PRP-AC-11: a failing delete is an infrastructure error", async () => {
    const { avatars } = storage({ removeError: { message: "x" } });
    await expect(avatars.remove("u1", `${BASE}u1/a.webp`)).rejects.toBeInstanceOf(InfrastructureError);
  });
});
