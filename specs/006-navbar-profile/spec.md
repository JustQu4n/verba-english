# 006 — Hồ sơ người dùng trên thanh điều hướng

- **Status:** In progress
- **Tiền tố AC:** NAV

## 1. Bối cảnh & mục tiêu
Người đã đăng nhập cần nhìn thấy ngay mình đang dùng tài khoản nào (tên, email, ảnh đại diện) và có lối đi nhanh tới khu vực của mình hoặc đăng xuất, ngay trên thanh điều hướng.

## 2. Phạm vi
- **Trong:** hiển thị tên, email, ảnh đại diện trên thanh điều hướng của trang chủ; menu tài khoản có "Vào dashboard" và "Đăng xuất"; cách chọn tên/chữ cái đại diện khi thiếu dữ liệu.
- **Ngoài:** sửa hồ sơ, đổi ảnh đại diện, trang cài đặt tài khoản.

## 3. Kịch bản người dùng
- Là người dùng đã đăng nhập, tôi thấy ảnh, tên và email của mình ở góc phải thanh điều hướng.
- Là người dùng chưa có ảnh hoặc tên, tôi vẫn thấy một biểu tượng chữ cái và tên hợp lý.
- Là người dùng điện thoại, tôi thấy ảnh đại diện và mở menu để xem tên, email.

## 4. Yêu cầu chức năng
- **FR-1** Tên ưu tiên lấy từ hồ sơ; thiếu thì lấy từ email; thiếu cả hai thì dùng tên chung.
- **FR-2** Không có ảnh (hoặc ảnh không tải được) thì hiện chữ cái đầu của tên.
- **FR-3** Chỉ nhận ảnh đại diện từ địa chỉ `https`.
- **FR-4** Hồ sơ đọc lỗi không làm mất trạng thái đã đăng nhập: vẫn hiện tên/email theo tài khoản.
- **FR-5** Menu dùng được bằng chuột lẫn bàn phím.

## 5. Tiêu chí chấp nhận
- **NAV-AC-01** Given hồ sơ có tên đầy đủ, when tạo thông tin hiển thị, then tên là tên đầy đủ đã cắt khoảng trắng thừa.
- **NAV-AC-02** Given hồ sơ không có tên hoặc tên chỉ gồm khoảng trắng, when tạo thông tin hiển thị, then tên là phần trước dấu `@` của email; không có cả email thì là "Người dùng".
- **NAV-AC-03** Given một tên, when tạo chữ cái đại diện, then là chữ cái đầu của từ đầu và từ cuối, viết hoa, giữ nguyên dấu tiếng Việt ("Lê Quốc" → "LQ", "Nguyễn Văn An" → "NA", "an" → "A").
- **NAV-AC-04** Given địa chỉ ảnh đại diện, when tạo thông tin hiển thị, then chỉ giữ địa chỉ `https`; `http`, `javascript:`, `data:` hoặc địa chỉ hỏng thì coi như không có ảnh.
- **NAV-AC-05** Given tài khoản có email, when tạo thông tin hiển thị, then email được giữ nguyên; không có email thì là chuỗi rỗng.
- **NAV-AC-06** Given đã đăng nhập nhưng đọc hồ sơ lỗi, when quyết định phần tài khoản ở đầu trang, then vẫn là trạng thái đã đăng nhập với tên/email lấy từ tài khoản và không có ảnh.
- **NAV-AC-07** `manual` Thanh điều hướng hiển thị ảnh đại diện; từ màn hình trung bình trở lên có thêm tên (đậm) và email (nhạt) cạnh ảnh, dài quá thì cắt bằng dấu "…". Menu mở khi bấm hoặc nhấn Enter/Space, đóng bằng Esc hoặc bấm ra ngoài, di chuyển bằng phím mũi tên. *Kiểm tra:* đăng nhập rồi thử trên máy tính và ở chiều rộng 390px.
- **NAV-AC-08** `manual` Ảnh không tải được thì hiện chữ cái đại diện thay vì ô ảnh vỡ. *Kiểm tra:* đăng nhập bằng tài khoản email (không có ảnh) hoặc tắt mạng tới `googleusercontent.com`.
- **NAV-AC-09** `manual` Menu có "Vào dashboard" (dẫn tới `/dashboard`) và "Đăng xuất" (kết thúc phiên, về `/login`). *Kiểm tra:* bấm từng mục.

## 6. Ràng buộc phi chức năng & bảo mật
- Địa chỉ ảnh từ nguồn ngoài chỉ được dùng khi hợp lệ (NAV-AC-04); ảnh tải không gửi thông tin nguồn trang (`referrerPolicy="no-referrer"`).
- Email chỉ hiển thị cho chính người dùng đó.

## 7. Câu hỏi mở
- Chưa có.
