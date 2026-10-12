# 007 — Đa ngôn ngữ Tiếng Việt / English

- **Status:** In progress
- **Tiền tố AC:** I18N

## 1. Bối cảnh & mục tiêu
Giao diện cần dùng được bằng tiếng Việt và tiếng Anh, người dùng đổi ngôn ngữ được bất cứ lúc nào và lựa chọn được nhớ lại.

## 2. Phạm vi
- **Trong:** thư viện `next-intl`; ngôn ngữ trên URL; bản dịch cho trang chủ, đăng nhập, dashboard, menu tài khoản; nút đổi ngôn ngữ; ngôn ngữ của `<html lang>`; giữ nguyên ngôn ngữ khi chuyển hướng đăng nhập.
- **Ngoài:** dịch thông báo lỗi sinh ra từ lớp domain/application (còn tiếng Việt), nội dung bài viết của người dùng, thêm ngôn ngữ thứ ba (chỉ cần thêm một tệp `messages/<mã>.json` và một mã trong `routing.ts`).

## 3. Kịch bản người dùng
- Người dùng mở `/` thấy tiếng Việt (mặc định); mở `/en` thấy tiếng Anh.
- Bấm nút ngôn ngữ để đổi, vẫn ở đúng trang đang xem.
- Lần sau quay lại, ngôn ngữ đã chọn được nhớ (cookie `NEXT_LOCALE`).

## 4. Yêu cầu chức năng
- **FR-1** Ngôn ngữ hỗ trợ: `vi` (mặc định, không có tiền tố) và `en` (tiền tố `/en`).
- **FR-2** Mọi chuỗi hiển thị nằm trong `messages/vi.json` và `messages/en.json`, hai tệp có cùng cấu trúc.
- **FR-3** Khách vào trang cần đăng nhập được chuyển tới trang đăng nhập đúng ngôn ngữ.
- **FR-4** Các route `api` và `auth` không có tiền tố ngôn ngữ.

## 5. Tiêu chí chấp nhận
- **I18N-AC-01** Given hai tệp bản dịch, when so khóa, then hai tệp có đúng cùng tập khóa (không thiếu, không thừa).
- **I18N-AC-02** Given hai tệp bản dịch, when duyệt giá trị, then không có chuỗi rỗng.
- **I18N-AC-03** Given một chuỗi có tham số `{name}`, when so hai ngôn ngữ, then cùng một bản dịch có đúng cùng tập tham số.
- **I18N-AC-04** Given một đường dẫn, when tách ngôn ngữ, then trả về ngôn ngữ và đường dẫn không tiền tố (`/en/login` → `en`, `/login`; `/login` → `vi`, `/login`; `/english` không bị coi là `/en`).
- **I18N-AC-05** Given đường dẫn và ngôn ngữ, when tạo đường dẫn theo ngôn ngữ, then `vi` không có tiền tố và `en` có tiền tố `/en`; gốc `/` của `en` là `/en`.
- **I18N-AC-06** Given khách chưa đăng nhập vào `/en/dashboard`, when kiểm tra phiên, then bị chuyển tới `/en/login`.
- **I18N-AC-07** Given người đã đăng nhập vào `/en/dashboard`, when kiểm tra phiên, then được đi tiếp.
- **I18N-AC-08** `manual` Mở `/en` thấy giao diện tiếng Anh với `<html lang="en">`; mở `/` thấy tiếng Việt với `lang="vi"`. *Kiểm tra:* xem trang và "View source".
- **I18N-AC-09** `manual` Nút ngôn ngữ ở thanh điều hướng và trang đăng nhập đổi ngôn ngữ, giữ nguyên trang, và lựa chọn được nhớ sau khi tải lại. *Kiểm tra:* đổi sang English, đóng tab, mở lại `/`.
- **I18N-AC-10** `manual` Đăng nhập, đăng xuất, mở dashboard ở tiếng Anh vẫn ở tiếng Anh. *Kiểm tra:* thử với Google thật.

## 6. Ràng buộc phi chức năng & bảo mật
- `next` sau đăng nhập vẫn đi qua `safeNextPath`; tiền tố ngôn ngữ không được mở đường cho chuyển hướng ra ngoài.

## 7. Câu hỏi mở
- Thông báo lỗi từ domain (ví dụ sai mật khẩu) còn tiếng Việt, cần chuyển sang mã lỗi + bản dịch ở một spec riêng.
