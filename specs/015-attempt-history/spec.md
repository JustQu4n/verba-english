# 015 — Lưu đáp án đúng đã làm và xem lại

- **Status:** In progress
- **Tiền tố AC:** ATT

## 1. Bối cảnh & mục tiêu
Hiện chỉ lưu việc một câu đã xong (spec 012). Người học muốn xem lại đáp án đúng của mình và nhận xét đã nhận. Chỉ đáp án **đúng** được lưu, để dữ liệu không phình ra vì gửi sai hoặc gửi lặp. Mỗi đáp án đúng lưu ba phần tách bạch: lần làm (`practice_attempts`), bài viết đã nộp (`submissions`) và kết quả chấm (`evaluations`).

## 2. Phạm vi
- **Trong phạm vi:** ghi mỗi lần gửi bài được chấm là đúng (bằng AI hoặc đáp án chuẩn); trang "Lịch sử làm bài" cho người học xem lại, mới nhất trước, có phân trang.
- **Ngoài phạm vi:** xóa hoặc sửa lịch sử; lọc theo chủ đề; xuất file; lưu câu trả lời sai; lưu lần gửi bị lỗi (AI hỏng, hết credit); lịch sử theo ngày (`user_daily_usage`).

## 3. Kịch bản người dùng
- Là người học, tôi mở "Lịch sử làm bài" và thấy câu tiếng Việt, bài tôi đã viết, đúng hay sai, và nhận xét đã nhận.
- Là người học, tôi chỉ thấy bài của mình.

## 4. Yêu cầu chức năng
- **FR-1** Mỗi lần gửi bài được chấm là đúng (kể cả câu lấy từ cache hoặc khớp đáp án chuẩn) ghi ba bản ghi cùng lúc: một lần làm, một bài nộp (nguyên văn người học gõ, đã bỏ khoảng trắng hai đầu) và một kết quả chấm (nguồn AI/đáp án chuẩn, ngôn ngữ nhận xét, câu gợi ý, ghi chú, nhận xét). Câu trả lời sai không được lưu.
- **FR-2** Lưu lịch sử là phần phụ: nếu ghi lỗi thì người học vẫn nhận được kết quả chấm; lỗi được ghi log không kèm nội dung bài viết.
- **FR-3** Chỉ máy chủ ghi (hàm `record_attempt` dành cho service role); người học chỉ đọc được bản ghi của mình qua RLS và không sửa, không xóa được.
- **FR-4** Xóa tài khoản hoặc xóa đề thì xóa lịch sử tương ứng theo tầng.
- **FR-6** Giữ lịch sử gọn: gửi lại đúng câu trả lời cũ (không phân biệt hoa thường, dấu câu, khoảng trắng) cho cùng một câu thì cập nhật lần làm cũ (tăng số lần gửi, ghi thời điểm và kết quả chấm mới nhất) thay vì thêm dòng mới; mỗi người học chỉ giữ 5 đáp án đúng khác nhau gần nhất cho mỗi câu, bản cũ hơn bị xóa cùng bài viết và kết quả chấm. Vì vậy số dòng của một người có chặn trên: tối đa 5 mỗi đề.
- **FR-5** Trang lịch sử dùng được ở 390px, đủ Tiếng Việt và English, 20 lần làm mỗi trang.

## 5. Tiêu chí chấp nhận
- **ATT-AC-01** Given một câu trả lời, when chấm xong, then chỉ khi đúng mới lưu, và lưu đủ: đề, cách chấm, bài viết và kết quả chấm; câu sai không lưu, ở cả hai cách chấm.
- **ATT-AC-02** Given lưu lịch sử bị lỗi, when chấm bài, then người học vẫn nhận kết quả chấm, điểm và tiến độ như bình thường.
- **ATT-AC-03** Given chấm lỗi (hết credit, AI hỏng, đề không có), when gửi bài, then không ghi lần làm nào.
- **ATT-AC-04** Given người học đã đăng nhập, when xem lịch sử, then nhận các lần làm của mình, chỉ các lần đúng, mới nhất trước, đúng 20 mỗi trang; trang không hợp lệ về trang 1; khách bị từ chối.
- **ATT-AC-05** Given dữ liệu lưu, when đọc ra, then ghi chú cải thiện hỏng hoặc thiếu thì bỏ qua thay vì làm hỏng cả trang; đề đã gỡ vẫn hiện bài đã làm.
- **ATT-AC-06** `manual` Ba bảng có RLS: người học đọc được bản ghi của mình, không insert/update/delete được trực tiếp; `record_attempt` chỉ service role gọi được; xóa đề hoặc người dùng thì lịch sử mất theo. *Kiểm tra:* chạy migration 0010, thử ghi bằng khóa anon.
- **ATT-AC-07** `manual` Trang "Lịch sử làm bài" có từ màn chọn; mỗi mục hiện câu tiếng Việt, bài đã viết, cách chấm, số lần gửi, câu gợi ý, ghi chú và nhận xét; có phân trang; trống thì có lời mời luyện tập; dùng được ở 390px. *Kiểm tra:* làm vài câu rồi mở trang.
- **ATT-AC-08** Given một câu trả lời, when ghi lần làm, then gửi kèm khóa so khớp (đã bỏ hoa thường, dấu câu, khoảng trắng) để máy chủ gộp các lần gửi giống nhau; số lần gửi đọc ra từ dữ liệu, thiếu thì coi là 1.
- **ATT-AC-09** `manual` Gửi cùng một câu trả lời nhiều lần (có thể khác hoa thường hoặc dấu chấm) cho một đề chỉ cho một dòng với số lần gửi tăng và kết quả mới nhất; gửi 7 đáp án đúng khác nhau cho một đề chỉ còn 5 dòng mới nhất, bài viết và kết quả chấm của dòng bị xóa cũng mất. *Kiểm tra:* chạy migration 0011, gửi lặp một đáp án đúng rồi gửi bảy cách viết đúng khác nhau, xem ba bảng.

## 6. Ràng buộc phi chức năng & bảo mật
- Bài viết của người học nay được lưu, nhưng chỉ chủ sở hữu đọc được; không ghi log nội dung bài viết.
- Dung lượng có chặn trên: tối đa 5 đáp án đúng khác nhau mỗi người cho mỗi đề (migration 0011); gửi lặp không làm bảng phình ra.
- Bài viết tối đa 300 ký tự (như spec 009), được kiểm tra cả ở cơ sở dữ liệu.
- Ba bảng cũ chưa dùng cùng tên (nếu có) chỉ được thay khi đang trống; nếu có dữ liệu, migration dừng lại.

## 7. Câu hỏi mở
- [NEEDS CLARIFICATION: Có cần cho người học xóa lịch sử của mình không? Hiện chưa có.]
