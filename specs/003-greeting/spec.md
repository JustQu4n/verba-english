# 003 — Lời chào (demo)

- **Status:** Implemented
- **Tiền tố AC:** GRT

## 1. Bối cảnh & mục tiêu
Ví dụ nhỏ nhất của một tính năng đi hết các lớp, dùng làm mẫu cho quy trình SDD + TDD.

## 4. Yêu cầu chức năng
- **FR-1** Cho một cái tên, hệ thống trả về lời chào tiếng Việt.

## 5. Tiêu chí chấp nhận
- **GRT-AC-01** Given tên hợp lệ (có thể có khoảng trắng thừa), when chào, then trả `Xin chào, <tên đã cắt khoảng trắng>!`.
- **GRT-AC-02** Given tên rỗng hoặc chỉ khoảng trắng, when chào, then báo lỗi dữ liệu "Tên không được để trống".
- **GRT-AC-03** Given dữ liệu thiếu hoặc không phải đối tượng có `name`, when chào, then báo lỗi dữ liệu.
