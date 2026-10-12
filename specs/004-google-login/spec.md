# 004 — Đăng nhập bằng Google

- **Status:** In progress
- **Tiền tố AC:** GGL

## 1. Bối cảnh & mục tiêu
Người dùng muốn vào ứng dụng nhanh bằng tài khoản Google, không cần tạo và nhớ thêm mật khẩu. Phiên đăng nhập phải tự duy trì (không bị đá ra giữa chừng) và đăng xuất phải dứt điểm.

## 2. Phạm vi
- **Trong:** đăng nhập/đăng ký bằng Google, quay lại ứng dụng sau khi Google xác nhận, chuyển người dùng tới trang họ định vào, duy trì phiên, hồ sơ lấy tên và ảnh từ Google.
- **Ngoài:** nhà cung cấp khác (GitHub, Apple...), liên kết/hủy liên kết nhiều danh tính thủ công, lấy dữ liệu Google khác (lịch, drive).

## 3. Kịch bản người dùng
- Là khách, tôi bấm "Tiếp tục với Google", chọn tài khoản và vào thẳng ứng dụng.
- Là người dùng đang đăng nhập, tôi mở lại ứng dụng sau một thời gian và vẫn còn đăng nhập.
- Là người dùng, nếu tôi hủy ở màn hình Google, tôi quay lại trang đăng nhập và thấy lý do.

## 4. Yêu cầu chức năng
- **FR-1** Bắt đầu đăng nhập Google từ trang đăng nhập; sau khi xong người dùng vào trang đích (mặc định dashboard).
- **FR-2** Chỉ chuyển hướng tới đường dẫn nội bộ của ứng dụng; không bao giờ tới địa chỉ ngoài do bên thứ ba chỉ định.
- **FR-3** Mọi lỗi trong quá trình đăng nhập đưa người dùng về trang đăng nhập kèm thông báo dễ hiểu.
- **FR-4** Phiên được làm mới tự động khi người dùng truy cập.
- **FR-5** Địa chỉ gốc của ứng dụng cấu hình được theo môi trường (local / production).

## 5. Tiêu chí chấp nhận
- **GGL-AC-01** Given địa chỉ quay lại hợp lệ, when bắt đầu đăng nhập Google, then nhận được địa chỉ màn hình đồng ý của Google để chuyển hướng người dùng đến.
- **GGL-AC-02** Given địa chỉ quay lại không phải URL hợp lệ, when bắt đầu đăng nhập Google, then báo lỗi dữ liệu và không gọi dịch vụ xác thực.
- **GGL-AC-03** Given dịch vụ xác thực, when lấy địa chỉ đăng nhập Google, then yêu cầu nhà cung cấp `google` với đúng địa chỉ quay lại và không tự chuyển hướng trình duyệt (để máy chủ điều khiển chuyển hướng).
- **GGL-AC-04** Given dịch vụ trả lỗi hoặc không trả địa chỉ (vd Google chưa được bật), when lấy địa chỉ đăng nhập, then báo lỗi hạ tầng, không lộ chi tiết cấu hình cho người dùng.
- **GGL-AC-05** Given Google quay lại với mã hợp lệ, when xử lý quay lại, then phiên được tạo và người dùng được chuyển tới trang đích nội bộ được yêu cầu, mặc định `/dashboard`.
- **GGL-AC-06** Given trang đích là địa chỉ ngoài hoặc dạng đánh lừa (`https://evil.com`, `//evil.com`, `/\evil.com`, chứa ký tự điều khiển), when xử lý quay lại hoặc chọn trang đích, then bỏ qua và dùng trang mặc định.
- **GGL-AC-07** Given Google báo lỗi/người dùng hủy, hoặc thiếu mã, hoặc đổi mã thất bại, when xử lý quay lại, then chuyển về `/login` kèm mã lỗi tương ứng (`oauth_failed`, `missing_code`, `auth_failed`) và không tạo phiên.
- **GGL-AC-08** Given phiên cần làm mới, when bất kỳ yêu cầu nào đi qua lớp bảo vệ, then cookie phiên mới được gắn vào phản hồi — kể cả khi yêu cầu bị chuyển hướng.
- **GGL-AC-09** `manual` Given người dùng đăng nhập Google lần đầu, when tài khoản được tạo, then hồ sơ tự có tên và ảnh đại diện lấy từ Google. *Kiểm tra:* đăng nhập Google bằng tài khoản mới, vào `/api/me`, xem `fullName` và `avatarUrl`.
- **GGL-AC-10** `manual` Luồng đầu-cuối: (a) bấm nút Google → chọn tài khoản → vào `/dashboard`; (b) đăng xuất → về `/login`, mở `/dashboard` bị chuyển về `/login`; (c) đăng nhập lại, tắt và mở lại trình duyệt, `/dashboard` vẫn vào được; (d) hủy ở màn hình Google → thấy thông báo ở `/login`. *Kiểm tra:* làm tay theo `docs/google-login-setup.md` mục 7.
- **GGL-AC-11** `manual` Trang đăng nhập có nút "Tiếp tục với Google" và hiển thị thông báo tiếng Việt cho từng mã lỗi ở GGL-AC-07. *Kiểm tra:* mở `/login?error=auth_failed`.
- **GGL-AC-12** Given biến cấu hình địa chỉ gốc (có thể thừa dấu `/` cuối), when tạo địa chỉ quay lại, then dùng đúng giá trị đó đã chuẩn hóa; chưa cấu hình thì dùng `http://localhost:3000`.

## 6. Ràng buộc phi chức năng & bảo mật
- Chống open redirect (FR-2, GGL-AC-06).
- Dùng luồng PKCE: mã trả về chỉ đổi được ở máy chủ; không để lộ Client Secret trong code hay repo.
- Không ghi token của Google vào log.

## 7. Câu hỏi mở
- Chưa có. (Mặc định: không lưu `provider_token` của Google vì chỉ cần danh tính.)
