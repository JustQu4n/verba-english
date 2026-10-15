# 002 — Hồ sơ người dùng

- **Status:** Implemented
- **Tiền tố AC:** PRF

## 1. Bối cảnh & mục tiêu
Người dùng đã đăng nhập xem được thông tin hồ sơ của chính mình. Hồ sơ tạo tự động khi đăng ký.

## 2. Phạm vi
- **Trong:** đọc hồ sơ của chính mình.
- **Ngoài:** xem hồ sơ người khác. (Sửa hồ sơ và tải ảnh đại diện: xem `018-profile-page`.)

## 4. Yêu cầu chức năng
- **FR-1** Chỉ người đã đăng nhập mới xem được hồ sơ, và chỉ hồ sơ của chính họ.
- **FR-2** Hồ sơ gồm tên đầy đủ, ảnh đại diện (có thể trống) và ngày tạo.

## 5. Tiêu chí chấp nhận
- **PRF-AC-01** Given chưa đăng nhập, when xem hồ sơ của tôi, then báo lỗi chưa xác thực.
- **PRF-AC-02** Given đã đăng nhập và có hồ sơ, when xem hồ sơ của tôi, then trả về người dùng và hồ sơ.
- **PRF-AC-03** Given đã đăng nhập nhưng chưa có hồ sơ, when xem hồ sơ của tôi, then trả về người dùng và hồ sơ rỗng (`null`).
- **PRF-AC-04** Given dữ liệu hồ sơ trong kho, when đọc, then ánh xạ sang thực thể gồm `fullName`, `avatarUrl`, `createdAt` (kiểu ngày).
- **PRF-AC-05** Given không có hồ sơ cho id, when đọc, then trả `null`.
- **PRF-AC-06** Given kho dữ liệu lỗi, when đọc, then báo lỗi hạ tầng (không lộ chi tiết gốc).
- **PRF-AC-07** `manual` Given dữ liệu của người dùng khác, when truy vấn bằng phiên của tôi, then không đọc được (RLS). *Kiểm tra:* thử `select` bảng `profiles` bằng tài khoản thứ hai trong Supabase.

## 6. Ràng buộc phi chức năng & bảo mật
- Bảng hồ sơ bật RLS; mỗi người chỉ thao tác trên dòng của mình.
