# 021 — Bộ nhớ đệm dùng chung cho dữ liệu đọc nhiều

- **Status:** Implemented
- **Tiền tố AC:** CHE
- **Tác giả / ngày:** 2026-10-19

## 1. Bối cảnh & mục tiêu
Cache chấm AI nằm trong RAM từng instance nên trên serverless gần như không trúng, và các dữ liệu mọi người cùng đọc (top bảng xếp hạng, số câu theo chủ đề) bị đọc lại từ cơ sở dữ liệu ở mỗi lượt. Mục tiêu là giảm số lần gọi AI, gọi API từ điển và truy vấn cơ sở dữ liệu mà không làm sai dữ liệu của từng người.

## 2. Phạm vi
- **Trong:** cache kết quả chấm AI dùng chung (`grade_cache`, xem AIG-AC-30/31); cache từ điển nhớ cả từ "không có", gộp lần gọi trùng và dọn dòng hết hạn (xem DIC-AC-20..22); cache dùng chung cho top bảng xếp hạng và số câu theo chủ đề.
- **Ngoài:** cache dữ liệu cá nhân (tiến độ, hạng của chính mình, số dư credit), cache trang admin, bộ đếm tỷ lệ trúng cache.

## 3. Yêu cầu chức năng
- **FR-1** Chỉ dữ liệu công khai và dùng chung được cache dùng chung: top 10 bảng xếp hạng và số câu đã xuất bản theo chủ đề. Dữ liệu của riêng một người luôn đọc trực tiếp.
- **FR-2** Top bảng xếp hạng cũ tối đa khoảng 1 phút; số câu theo chủ đề tối đa khoảng 5 phút.
- **FR-3** Khi quản trị viên đổi điểm, tên hoặc vai trò của một tài khoản, hoặc người học đổi tên hoặc ảnh, cache bảng xếp hạng bị làm mới ngay. Khi quản trị viên thêm, sửa, xóa đề, cache số câu theo chủ đề bị làm mới ngay.
- **FR-4** Cache không bao giờ làm hỏng chức năng chính: không có khóa service hoặc cache lỗi thì đọc trực tiếp (số câu) hoặc báo lỗi hạ tầng như trước (bảng xếp hạng, vốn đã dùng khóa service).

## 4. Tiêu chí chấp nhận
- **CHE-AC-01** Given bảng xếp hạng, when đọc top, then lấy từ cache dùng chung; hạng của một người ngoài top vẫn đọc trực tiếp, không qua cache.
- **CHE-AC-02** Given số câu theo chủ đề, when đọc, then lấy từ cache dùng chung; danh sách câu và từng câu vẫn đọc trực tiếp.
- **CHE-AC-03** Given cache số câu lỗi hoặc thiếu khóa service, when đọc, then đọc trực tiếp bằng phiên của người học; lỗi điều hướng của Next được ném lên như cũ.
- **CHE-AC-04** `manual` Sau khi đổi điểm hoặc tên của một tài khoản ở trang Admin, hoặc đổi tên hoặc ảnh ở trang hồ sơ, mở bảng xếp hạng thấy thay đổi ngay (không phải chờ 1 phút). *Kiểm tra:* đổi tên rồi mở `/dashboard/leaderboard`.
- **CHE-AC-05** `manual` Sau khi quản trị viên thêm, sửa hoặc xóa một đề, màn chọn chủ đề thấy số câu mới ngay. *Kiểm tra:* thêm một đề đã xuất bản rồi mở màn chọn chủ đề.
- **CHE-AC-06** `manual` Given migration `0019_caches.sql`, then người dùng bằng khóa anon hoặc phiên đăng nhập không đọc được bảng `grade_cache` và `dictionary_cache`. *Kiểm tra:* gọi từ trình duyệt.
