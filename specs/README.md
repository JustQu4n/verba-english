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
| [009-writing-sentence](./009-writing-sentence/spec.md) | Luyện viết câu: chọn trình độ, chủ đề, màn luyện viết | `WSN` |
| [010-admin-prompts](./010-admin-prompts/spec.md) | Khu Admin: quyền quản trị và CRUD đề bài | `APR` |
| [011-ai-grading](./011-ai-grading/spec.md) | Chấm câu bằng AI (Gemini) và credit | `AIG` |
| [012-sentence-progress](./012-sentence-progress/spec.md) | Lịch sử làm bài và tiến độ luyện câu | `SPG` |
| [013-points](./013-points/spec.md) | Điểm thưởng mỗi câu, pháo hoa chúc mừng, phím Enter | `PTS` |
| [014-accepted-answers](./014-accepted-answers/spec.md) | Đáp án chuẩn có cấu trúc ngữ pháp, chấm không cần AI, AI soạn sẵn cho admin | `ANS` |
| [015-attempt-history](./015-attempt-history/spec.md) | Lưu đáp án đúng đã làm và xem lại | `ATT` |
| [016-theme](./016-theme/spec.md) | Giao diện sáng / tối | `THM` |
| [017-leaderboard](./017-leaderboard/spec.md) | Bảng xếp hạng top 10 theo điểm, bục top 3 | `LDB` |
| [018-profile-page](./018-profile-page/spec.md) | Trang hồ sơ, xếp hạng, các lần làm bài, đổi tên và ảnh đại diện (Supabase Storage) | `PRP` |
| [019-admin-console](./019-admin-console/spec.md) | Bảng điều khiển Admin: menu trái, tổng quan, quản lý tài khoản, bảng xếp hạng có phân trang | `ADM` |
| [020-dictionary](./020-dictionary/spec.md) | Popup từ điển khi bôi đen từ, cache, lưu từ vựng để ôn lại | `DIC` |
| [021-caching](./021-caching/spec.md) | Cache dùng chung: chấm AI, từ điển, top bảng xếp hạng, số câu theo chủ đề | `CHE` |

Kiểm tra mọi AC đều có test: `npm run specs:check`.
