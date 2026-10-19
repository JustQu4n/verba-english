# 009 — Luyện viết câu (Writing → Sentence)

- **Status:** In progress
- **Tiền tố AC:** WSN

## 1. Bối cảnh & mục tiêu
Người học muốn luyện viết từng câu tiếng Anh: đọc một câu tiếng Việt rồi tự viết lại bằng tiếng Anh. Họ cần chọn mức độ phù hợp và chủ đề mình quan tâm, rồi luyện liên tục từng câu một. Giao diện phải gọn, tập trung vào câu đang làm, và cùng tông đen trắng hiện đại với logo Verba.

## 2. Phạm vi
- **Trong phạm vi:** mục Writing → Sentence trong dashboard; chọn trình độ và chủ đề; màn luyện viết (câu tiếng Việt, ô nhập, Thoát, Bỏ qua, Gợi ý, Gửi); khung phản hồi; dữ liệu mẫu nạp bằng `supabase/seed.sql`; giao diện hai ngôn ngữ.
- **Ngoài phạm vi:** chấm điểm bằng AI và credit (xem spec 011); lưu bài viết; lịch sử; luyện đoạn văn (Paragraph); quản trị đề bài.

## 3. Kịch bản người dùng
- Là người học, tôi vào dashboard và mở Writing → Sentence.
- Là người học, tôi chọn trình độ (Beginner, Intermediate, Advanced) và một trong 20 chủ đề rồi bắt đầu.
- Là người học, tôi đọc câu tiếng Việt, viết bản tiếng Anh và gửi đi.
- Là người học, tôi bỏ qua một câu khó, hoặc xem gợi ý từ khóa.
- Là người học, tôi thoát về màn chọn để đổi trình độ hoặc chủ đề.

## 4. Yêu cầu chức năng
- **FR-1** Có ba trình độ theo thứ tự tăng dần và hai mươi chủ đề cố định.
- **FR-2** Chỉ bắt đầu được khi đã chọn đủ trình độ và chủ đề.
- **FR-3** Mỗi lần lấy câu, hệ thống trả một câu đúng trình độ và chủ đề đã chọn, ưu tiên câu chưa gặp trong phiên luyện.
- **FR-4** Bài viết rỗng hoặc dài quá giới hạn thì không gửi được.
- **FR-5** Chỉ người đã đăng nhập mới lấy được câu.
- **FR-6** Phần phản hồi hiện kết quả chấm của AI (spec 011); lỗi chấm không làm mất bài viết.

## 5. Tiêu chí chấp nhận
- **WSN-AC-01** Given danh mục luyện câu, when liệt kê trình độ, then có đúng ba trình độ theo thứ tự beginner, intermediate, advanced.
- **WSN-AC-02** Given danh mục luyện câu, when liệt kê chủ đề, then có đúng hai mươi chủ đề và mã không trùng nhau.
- **WSN-AC-03** Given tệp dữ liệu mẫu `supabase/seed.sql`, when xét mọi cặp trình độ và chủ đề, then mỗi cặp có ít nhất một câu, và mỗi câu có nội dung tiếng Việt cùng gợi ý không rỗng.
- **WSN-AC-04** Given người đã đăng nhập chọn một trình độ và một chủ đề, when lấy câu, then câu trả về thuộc đúng trình độ và chủ đề đó.
- **WSN-AC-05** Given danh sách câu đã gặp, when lấy câu tiếp theo, then ưu tiên câu chưa gặp; nếu đã gặp hết thì cho phép lặp lại (câu đã làm đúng thì không bao giờ trả lại, xem spec 012).
- **WSN-AC-06** Given trình độ hoặc chủ đề không thuộc danh mục, when lấy câu, then báo lỗi dữ liệu không hợp lệ và không truy vấn nguồn đề.
- **WSN-AC-07** Given cặp hợp lệ nhưng nguồn đề không có câu nào, when lấy câu, then báo không tìm thấy.
- **WSN-AC-08** Given người chưa đăng nhập, when lấy câu, then báo chưa đăng nhập và không truy vấn nguồn đề.
- **WSN-AC-09** Given bài viết, when kiểm tra khả năng gửi, then bài rỗng hoặc chỉ gồm khoảng trắng không gửi được, bài có nội dung thì gửi được.
- **WSN-AC-10** Given bài viết, when kiểm tra khả năng gửi, then bài dài hơn 300 ký tự (sau khi bỏ khoảng trắng hai đầu) không gửi được, đúng 300 ký tự thì gửi được.
- **WSN-AC-11** `manual` Mục Writing → Sentence có trên dashboard và dẫn tới màn chọn; mục Paragraph hiện nhãn "Sắp có" và không bấm được; người chưa đăng nhập vào đường dẫn này bị chuyển về trang đăng nhập. *Kiểm tra:* mở `/dashboard` khi đã đăng nhập và khi chưa đăng nhập.
- **WSN-AC-12** `manual` Màn chọn có ba thẻ trình độ và hai mươi thẻ chủ đề; chọn được bằng chuột hoặc bàn phím (Tab, Enter/Space); thẻ đang chọn đảo màu (nền đen chữ trắng) và có dấu tích; nút "Bắt đầu" bị vô hiệu cho tới khi chọn đủ cả hai. *Kiểm tra:* thử từng thẻ, thử chỉ chọn một mục.
- **WSN-AC-13** `manual` Màn luyện hiển thị chủ đề và trình độ đang chọn, tiến độ của cặp đang chọn, câu tiếng Việt cỡ lớn, ô nhập có bộ đếm ký tự, và một hàng nút: Thoát, Câu trước, Câu sau, Gợi ý, Gửi; nút Gửi bị vô hiệu khi bài không gửi được. *Kiểm tra:* bắt đầu một phiên và thử ô nhập rỗng, có chữ, vượt giới hạn.
- **WSN-AC-14** `manual` Câu sau chuyển sang câu mới (hoặc câu đã xem nếu đang ở giữa) và xóa ô nhập, Câu trước quay lại câu đã xem (vô hiệu ở câu đầu); Gợi ý bật/tắt phần từ khóa tiếng Anh dưới câu; Thoát về màn chọn và giữ nguyên lựa chọn trước đó. *Kiểm tra:* bấm từng nút.
- **WSN-AC-15** `manual` Bấm Gửi thì khung phản hồi hiện kết quả chấm của AI (xem spec 011); nút Câu sau luôn bấm được và nổi bật khi đã đúng. *Kiểm tra:* gửi một bài sai rồi một bài đúng.
- **WSN-AC-16** `manual` Giao diện đen trắng (nền trắng, chữ đen, thẻ đang chọn nền đen), dùng được ở chiều rộng 390px không cuộn ngang, có viền focus nhìn rõ khi dùng bàn phím, và đủ chữ ở cả Tiếng Việt lẫn English. *Kiểm tra:* thu hẹp cửa sổ, dùng Tab, đổi ngôn ngữ.
- **WSN-AC-17** `manual` Trong ô nhập, Enter gửi bài, Shift+Enter xuống dòng, Enter khi đang gõ bộ gõ (IME) không gửi; sau khi làm đúng, Enter sang câu tiếp theo; dưới ô nhập có dòng gợi ý phím. *Kiểm tra:* thử từng phím.
- **WSN-AC-18** `manual` Làm đúng câu cuối cùng của cặp (tiến độ 100%) thì tự chuyển sang trang hoàn thành, không cần bấm Câu sau; làm lại câu đã đúng không kích hoạt lại. *Kiểm tra:* hoàn thành câu cuối của một cặp.
- **WSN-AC-19** Given câu trả lời chưa đúng đã có phản hồi, when người học bắt đầu sửa ô nhập (nội dung khác với bản đã chấm), then dòng "Suggestion" bị ẩn để họ tự nghĩ lại; khi nội dung trở về đúng bản đã chấm thì hiện lại; các phần phản hồi khác (nhận xét, gợi ý cải thiện) giữ nguyên. Câu trả lời đúng luôn hiện "Suggestion".

## 6. Ràng buộc phi chức năng & bảo mật
- Bài viết của người học không được ghi log. Từ spec 015, mỗi lần gửi bài đã chấm được lưu vào cơ sở dữ liệu và chỉ chủ sở hữu đọc được.
- Câu luyện lấy qua máy chủ để sau này đổi nguồn (cơ sở dữ liệu) mà giao diện không đổi.
- Tôn trọng tùy chọn giảm chuyển động của hệ điều hành.

## 7. Câu hỏi mở
- [NEEDS CLARIFICATION: Có cần điểm thưởng và tín dụng như giao diện tham khảo không? Hiện đã đặt ngoài phạm vi, giao diện không hiển thị.]
- [NEEDS CLARIFICATION: Khi có chấm bài AI, mỗi lượt Gửi có trừ lượt chấm theo ngày (bảng giới hạn lượt dùng) không?]
