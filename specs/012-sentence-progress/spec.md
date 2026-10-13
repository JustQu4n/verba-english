# 012 — Lịch sử làm bài và tiến độ (Writing → Sentence)

- **Status:** In progress
- **Tiền tố AC:** SPG

## 1. Bối cảnh & mục tiêu
Người học chỉ sang được câu tiếp theo khi đã viết đúng câu hiện tại. Hệ thống ghi nhớ những câu họ đã làm đúng để không đưa lại câu đó nữa, và cho họ thấy mình đã hoàn thành bao nhiêu câu trong từng cặp trình độ và chủ đề.

## 2. Phạm vi
- **Trong phạm vi:** ghi lại câu đã làm đúng cho từng người học; loại các câu đã làm đúng khỏi việc chọn câu; tiến độ (số câu đã xong trên tổng số) theo trình độ và chủ đề; thanh tiến độ ở màn luyện và màn chọn; màn chúc mừng khi xong hết.
- **Ngoài phạm vi:** làm lại từ đầu hoặc xóa lịch sử; lưu nội dung câu trả lời và số lần thử; thống kê theo ngày; huy hiệu, chuỗi ngày luyện; câu bỏ qua (không tính là đã làm).

## 3. Kịch bản người dùng
- Là người học, tôi viết đúng một câu thì câu đó được ghi là đã xong và tôi sang câu khác.
- Là người học, tôi không gặp lại câu mình đã làm đúng, kể cả ở lần luyện sau hay trên thiết bị khác.
- Là người học, tôi thấy mình đã xong bao nhiêu trên tổng số câu của trình độ và chủ đề đang luyện.
- Là người học, khi xong hết các câu của một cặp tôi được báo và quay lại chọn chủ đề khác.
- Là người học, tôi bỏ qua một câu thì câu đó chưa tính là đã xong và vẫn có thể quay lại.

## 4. Yêu cầu chức năng
- **FR-1** Chỉ ghi "đã xong" khi AI chấm đúng; ghi theo người dùng và theo đề, mỗi cặp chỉ một lần; việc ghi do máy chủ thực hiện (xem spec 013).
- **FR-2** Chọn câu tiếp theo chỉ trong các câu đã xuất bản mà người dùng chưa xong; ưu tiên câu chưa gặp trong phiên, hết thì lặp lại các câu đã bỏ qua.
- **FR-3** Tiến độ = số câu đã xong còn đang xuất bản / tổng số câu đã xuất bản của cặp đó. Câu bị gỡ khỏi xuất bản hoặc bị xóa không còn tính.
- **FR-4** Hết câu chưa xong thì báo đã hoàn thành, không báo lỗi.
- **FR-5** Chỉ đọc và ghi lịch sử của chính mình; không sửa hay xóa được từ giao diện.

## 5. Tiêu chí chấp nhận
- **SPG-AC-01** Given đề đã xuất bản và người học, when tính tiến độ, then trả số câu đã xong và tổng số câu của cặp; câu đã xong không còn xuất bản không được tính.
- **SPG-AC-02** Given người chưa đăng nhập hoặc trình độ hay chủ đề không hợp lệ, when lấy tiến độ, then báo chưa đăng nhập hoặc lỗi dữ liệu và không đọc kho nào.
- **SPG-AC-03** Given câu đã xong, when lấy câu tiếp theo, then không bao giờ trả câu đó.
- **SPG-AC-04** Given mọi câu của cặp đã xong, when lấy câu tiếp theo, then trả "đã hoàn thành" cùng tiến độ (không phải lỗi); cặp không có câu nào thì vẫn báo không tìm thấy.
- **SPG-AC-05** Given câu chưa xong, when lấy câu tiếp theo, then ưu tiên câu chưa gặp trong phiên; nếu đã gặp hết thì cho phép lặp lại các câu chưa xong (câu bỏ qua).
- **SPG-AC-06** Given câu trả lời được chấm đúng, when chấm, then ghi câu đó là đã xong cho người dùng rồi trả tiến độ mới; kết quả đúng lấy từ bộ nhớ đệm cũng được ghi.
- **SPG-AC-07** Given câu trả lời chấm chưa đúng hoặc AI lỗi, when chấm, then không ghi gì vào lịch sử.
- **SPG-AC-08** Given kho lịch sử trên cơ sở dữ liệu, when đọc câu đã xong hoặc ghi một câu xong, then đọc đúng bảng, lọc theo người dùng, trình độ, chủ đề và xuất bản; ghi qua hàm máy chủ (xem PTS-AC-01); ghi trùng không gây lỗi; lỗi cơ sở dữ liệu báo lỗi hạ tầng không lộ nội dung gốc.
- **SPG-AC-09** `manual` Màn luyện có thanh tiến độ "Đã xong x/y" cập nhật ngay khi làm đúng một câu; màn chọn hiện tiến độ của cặp đang chọn.
- **SPG-AC-10** `manual` Làm đúng một câu rồi sang câu mới, thoát và vào lại: câu đã làm không xuất hiện lại. Bỏ qua một câu rồi thoát và vào lại: câu đó vẫn có thể xuất hiện.
- **SPG-AC-11** `manual` Làm xong mọi câu của một cặp thì hiện màn chúc mừng với nút quay lại chọn chủ đề khác.
- **SPG-AC-12** `manual` Dùng được ở 390px không cuộn ngang, đủ chữ Tiếng Việt và English, thanh tiến độ có nhãn cho trình đọc màn hình.
- **SPG-AC-13** `manual` Given người học, when thử xóa hoặc sửa lịch sử bằng phiên của mình, or tự ghi một câu bằng phiên của mình, then bị từ chối (chỉ máy chủ ghi được). *Kiểm tra:* lệnh SQL trong `docs/ai-grading-setup.md`.

## 6. Ràng buộc phi chức năng & bảo mật
- Người học chỉ thấy và ghi được lịch sử của chính mình (RLS); không có quyền sửa hoặc xóa.
- Không ghi log nội dung câu trả lời.
- Xóa đề bởi quản trị viên làm lịch sử của đề đó biến mất theo (xóa theo tầng).

## 7. Câu hỏi mở
- [NEEDS CLARIFICATION: Người học có cần nút "Làm lại" để xóa tiến độ của một chủ đề không? Hiện chưa có.]
- [NEEDS CLARIFICATION: Câu bỏ qua có nên tránh lặp lại trong cùng phiên không? Hiện: chỉ lặp khi đã gặp hết các câu chưa xong.]
