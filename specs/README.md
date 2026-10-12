# Specs

Mỗi tính năng là một thư mục `NNN-ten-ngan/` gồm `spec.md` (bắt buộc), `plan.md`, `tasks.md`.
Mẫu ở `_templates/`. Nguyên tắc ở [constitution.md](./constitution.md).

| Spec | Nội dung | Tiền tố AC |
|---|---|---|
| [000-core](./000-core/spec.md) | Lỗi nghiệp vụ, validate, ánh xạ lỗi → HTTP/form | `CORE` |
| [001-auth](./001-auth/spec.md) | Đăng ký, đăng nhập, đăng xuất, xác nhận email | `AUTH` |
| [002-profile](./002-profile/spec.md) | Hồ sơ người dùng hiện tại | `PRF` |
| [003-greeting](./003-greeting/spec.md) | Lời chào demo | `GRT` |
| [004-google-login](./004-google-login/spec.md) | Đăng nhập bằng Google, callback an toàn, làm mới phiên | `GGL` |
| [005-landing-page](./005-landing-page/spec.md) | Trang chủ giới thiệu, giao diện đăng nhập Google | `LND` |
| [006-navbar-profile](./006-navbar-profile/spec.md) | Tên, email, ảnh đại diện và menu tài khoản trên thanh điều hướng | `NAV` |
| [007-i18n](./007-i18n/spec.md) | Đa ngôn ngữ Tiếng Việt / English | `I18N` |
| [008-email-auth](./008-email-auth/spec.md) | Đăng ký và đăng nhập bằng email + mật khẩu | `EML` |

Kiểm tra mọi AC đều có test: `npm run specs:check`.
