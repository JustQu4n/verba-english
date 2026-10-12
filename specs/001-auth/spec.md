# 001 — Xác thực người dùng

- **Status:** Implemented
- **Tiền tố AC:** AUTH

## 1. Bối cảnh & mục tiêu
Người dùng cần tạo tài khoản và đăng nhập bằng email + mật khẩu để dùng các khu vực riêng tư của ứng dụng.

## 2. Phạm vi
- **Trong:** đăng ký, đăng nhập, đăng xuất, xác nhận email qua liên kết, bảo vệ khu vực riêng tư.
- **Ngoài:** quên mật khẩu, đăng nhập mạng xã hội, xác thực hai lớp.

## 3. Kịch bản người dùng
- Là khách, tôi muốn đăng ký bằng email để có tài khoản.
- Là người dùng, tôi muốn đăng nhập/đăng xuất an toàn.
- Là khách, khi vào khu vực riêng tư tôi được đưa về trang đăng nhập.

## 4. Yêu cầu chức năng
- **FR-1** Email phải hợp lệ; mật khẩu tối thiểu 6 ký tự.
- **FR-2** Đăng ký có thể yêu cầu xác nhận email trước khi dùng được.
- **FR-3** Sau khi đăng nhập/xác nhận thành công, người dùng vào trang dashboard.

## 5. Tiêu chí chấp nhận
- **AUTH-AC-01** Given email và mật khẩu hợp lệ, when đăng nhập, then yêu cầu được chuyển cho dịch vụ xác thực với đúng thông tin đó.
- **AUTH-AC-02** Given email không hợp lệ, when đăng nhập, then báo lỗi dữ liệu và không gọi dịch vụ xác thực.
- **AUTH-AC-03** Given mật khẩu ngắn hơn 6 ký tự, when đăng nhập, then báo lỗi dữ liệu.
- **AUTH-AC-04** Given thông tin đăng nhập sai, when đăng nhập, then báo lỗi chưa xác thực với thông điệp từ dịch vụ.
- **AUTH-AC-05** Given thông tin hợp lệ và chưa có phiên, when đăng ký, then kết quả cho biết cần xác nhận email.
- **AUTH-AC-06** Given thông tin hợp lệ và đã có phiên, when đăng ký, then kết quả cho biết không cần xác nhận email.
- **AUTH-AC-07** Given dữ liệu đăng ký sai định dạng, when đăng ký, then báo lỗi dữ liệu và không gọi dịch vụ.
- **AUTH-AC-08** Given dịch vụ từ chối đăng ký (vd email đã tồn tại), when đăng ký, then báo lỗi dữ liệu với thông điệp của dịch vụ.
- **AUTH-AC-09** Given liên kết xác nhận có mã hợp lệ, when hoàn tất đăng nhập, then phiên được tạo; với mã không hợp lệ thì báo lỗi chưa xác thực.
- **AUTH-AC-10** Given có phiên, when lấy người dùng hiện tại, then trả `{ id, email }`; không có phiên thì trả `null`.
- **AUTH-AC-11** Given người dùng đã đăng nhập, when đăng xuất, then phiên bị hủy.
- **AUTH-AC-12** Given khách chưa đăng nhập, when mở khu vực riêng tư (`/dashboard` và các đường dẫn con), then được chuyển về `/login`; người đã đăng nhập và các trang công khai thì đi tiếp bình thường.
- **AUTH-AC-13** `manual` Given đăng nhập thất bại, when gửi form, then thấy thông báo lỗi tiếng Việt ngay trên form. *Kiểm tra:* nhập sai mật khẩu ở `/login`.

## 6. Ràng buộc phi chức năng & bảo mật
- Xác thực phía server chỉ dựa trên người dùng đã được máy chủ xác minh, không tin dữ liệu phiên từ client.
- Không ghi mật khẩu vào log.

## 7. Câu hỏi mở
- Chưa có.
