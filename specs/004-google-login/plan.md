# 004 — Kế hoạch kỹ thuật

- **Spec:** ./spec.md
- **Kiểm tra hiến chương:** theo Clean Architecture; không ngoại lệ.

## 1. Thiết kế theo lớp
| Lớp | Thay đổi |
|---|---|
| domain | không đổi |
| application | thêm port `AuthService.getOAuthSignInUrl(provider, redirectTo)`; use case `startGoogleSignIn` (validate URL bằng zod) |
| infrastructure | `SupabaseAuthService.getOAuthSignInUrl` dùng `signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } })` → trả `data.url`; `updateSession` copy cookie sang phản hồi redirect; migration `0002` lấy tên/ảnh từ metadata của Google |
| presentation | Server Action `loginWithGoogle` (redirect tới URL của Google); `GET /auth/callback` (đổi mã → trang đích an toàn / `/login?error=`); helper `safeNextPath`, `getSiteUrl`; nút Google + hiển thị lỗi ở `/login` |

## 2. Dữ liệu & migration
`supabase/migrations/0002_profile_from_oauth.sql`: `create or replace function public.handle_new_user()` — `full_name` lấy `full_name` hoặc `name`, `avatar_url` lấy `avatar_url` hoặc `picture`.

## 3. Hợp đồng
- Bắt đầu: Server Action → Google. Quay lại: `GET /auth/callback?code=...&next=/duong-dan` → 307 tới `next` (nội bộ) hoặc `/dashboard`; lỗi → 307 `/login?error=<oauth_failed|missing_code|auth_failed>`.
- PKCE: `code_verifier` được lưu trong cookie bởi client server lúc bắt đầu, dùng lại ở callback.

## 4. Chiến lược test
| AC | Mức | File |
|---|---|---|
| 01, 02 | unit use case | `sign-in-with-google.test.ts` |
| 03, 04 | adapter (client giả) | `supabase-auth-service.test.ts` |
| 05, 06, 07 | route handler (container giả) + unit helper | `app/auth/callback/route.test.ts`, `lib/safe-redirect.test.ts` |
| 08 (+AUTH-AC-12) | proxy với `@supabase/ssr` giả | `infrastructure/supabase/proxy.test.ts` |
| 12 | unit | `lib/site-url.test.ts` |
| 09, 10, 11 | manual | `docs/google-login-setup.md` |

## 5. Rủi ro
- Cấu hình dashboard sai (redirect URI, Site URL) là nguyên nhân lỗi phổ biến nhất → có tài liệu từng bước và bảng lỗi thường gặp.
- Cookie phiên bị mất khi redirect trong proxy → GGL-AC-08.
