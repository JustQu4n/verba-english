# 000 — Lõi dùng chung: lỗi, validate, ánh xạ lỗi

- **Status:** Implemented
- **Tiền tố AC:** CORE

## 1. Bối cảnh & mục tiêu
Mọi tính năng cần cách thống nhất để báo lỗi nghiệp vụ và hiển thị lỗi cho người dùng mà không lộ chi tiết nội bộ.

## 2. Phạm vi
- **Trong:** kiểm tra dữ liệu đầu vào, phân loại lỗi, chuyển lỗi thành phản hồi HTTP và thông báo trong form.
- **Ngoài:** ghi log tập trung, i18n.

## 4. Yêu cầu chức năng
- **FR-1** Dữ liệu sai phải bị từ chối kèm thông báo tiếng Việt dễ hiểu.
- **FR-2** Mỗi loại lỗi nghiệp vụ có mã ổn định và trạng thái HTTP tương ứng.
- **FR-3** Lỗi không lường trước không được làm lộ thông điệp nội bộ cho người dùng.

## 5. Tiêu chí chấp nhận
- **CORE-AC-01** Given dữ liệu hợp lệ theo schema, when kiểm tra, then trả về dữ liệu đã chuẩn hóa.
- **CORE-AC-02** Given dữ liệu sai, when kiểm tra, then báo `VALIDATION_ERROR` với thông báo của lỗi đầu tiên.
- **CORE-AC-03** Given lỗi `VALIDATION_ERROR`, when trả HTTP, then status 400 và body `{ error: { code, message } }`.
- **CORE-AC-04** Given lỗi `UNAUTHORIZED`, when trả HTTP, then status 401.
- **CORE-AC-05** Given lỗi `NOT_FOUND`, when trả HTTP, then status 404.
- **CORE-AC-06** Given lỗi hạ tầng hoặc lỗi lạ, when trả HTTP, then status 500 với thông báo chung, không chứa nội dung lỗi gốc.
- **CORE-AC-07** Given lỗi nghiệp vụ (không phải hạ tầng), when hiển thị trong form, then hiện đúng thông báo của lỗi.
- **CORE-AC-08** Given lỗi hạ tầng hoặc lỗi lạ, when hiển thị trong form, then hiện thông báo chung, không lộ chi tiết.
- **CORE-AC-09** Given một Route Handler bị ném lỗi, when được bọc bởi cơ chế xử lý lỗi chung, then phản hồi theo CORE-AC-03..06 thay vì làm sập request.
- **CORE-AC-10** Given lỗi điều khiển luồng của nền tảng web (chuyển hướng, không tìm thấy, dữ liệu động), when đi qua cơ chế xử lý lỗi chung (HTTP hoặc form), then lỗi được ném lại nguyên vẹn, không bị biến thành phản hồi 500 hay thông báo lỗi.
- **CORE-AC-11** Given lỗi `FORBIDDEN` (đã đăng nhập nhưng không đủ quyền), when trả HTTP, then status 403.
- **CORE-AC-12** Given lỗi `INSUFFICIENT_CREDITS` (hết credit), when trả HTTP, then status 402.

## 6. Ràng buộc phi chức năng & bảo mật
- Không trả stack trace hay thông điệp lỗi của DB cho client.
