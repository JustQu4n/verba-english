# 013 — Điểm thưởng và pháo hoa chúc mừng

- **Status:** In progress
- **Tiền tố AC:** PTS

## 1. Bối cảnh & mục tiêu
Mỗi câu làm đúng cho người học 10 điểm. Tổng điểm được lưu trong hồ sơ để sau này làm bảng xếp hạng. Khi hoàn thành một cặp trình độ + chủ đề, màn hình có pháo hoa chúc mừng. Phím Enter gửi bài cho nhanh.

## 2. Phạm vi
- **Trong phạm vi:** cộng 10 điểm khi một câu được làm đúng lần đầu; cột điểm trong hồ sơ; hiển thị điểm trên thanh điều hướng và "+10" ở phản hồi; pháo hoa toàn màn hình khi xong một cặp; phím Enter gửi bài.
- **Ngoài phạm vi:** trang bảng xếp hạng (làm sau, cần hàm hoặc view riêng vì hồ sơ chỉ cho người dùng đọc dòng của mình); điểm thưởng khác (chuỗi ngày, tốc độ); trừ điểm.

## 3. Kịch bản người dùng
- Là người học, tôi làm đúng một câu lần đầu thì nhận 10 điểm và thấy tổng điểm trên thanh điều hướng.
- Là người học, câu đã làm đúng rồi thì không cộng điểm thêm (kể cả khi tôi gặp lại ở phiên khác).
- Là người học, khi xong hết các câu của một cặp tôi thấy pháo hoa toàn màn hình.
- Là người học, tôi nhấn Enter để gửi bài và Shift+Enter để xuống dòng.

## 4. Yêu cầu chức năng
- **FR-1** Điểm mỗi câu là hằng số 10, chỉ cộng khi câu được ghi "đã xong" lần đầu.
- **FR-2** Ghi "đã xong" và cộng điểm là một thao tác nguyên tử, chỉ do máy chủ thực hiện; người học không tự ghi hay sửa điểm được bằng phiên của mình.
- **FR-3** Tổng điểm nằm ở cột `points` trong hồ sơ, mặc định 0.
- **FR-5** Mỗi câu vừa được hoàn thành (đúng lần đầu, có cộng điểm) có một đợt pháo hoa ngắn khoảng hai giây, nhẹ hơn pháo hoa của cả cặp. Câu cuối của một cặp không chạy đợt ngắn mà đi thẳng đến trang hoàn thành với pháo hoa dài; câu đã làm đúng trước đó (không cộng điểm) và câu trả lời sai không có pháo hoa. Đợt ngắn dừng khi chuyển câu và tắt khi người dùng chọn giảm chuyển động.
- **FR-4** Pháo hoa chỉ chạy khi cặp vừa được hoàn thành trong lần luyện này, không chạy lại khi vào lại cặp đã xong; tắt khi người dùng chọn giảm chuyển động.

## 5. Tiêu chí chấp nhận
- **PTS-AC-01** Given câu được chấm đúng, when ghi hoàn thành, then gọi hàm máy chủ `complete_sentence` với người dùng và đề, trả số điểm vừa cộng và tổng điểm.
- **PTS-AC-02** Given câu đã được ghi trước đó, when ghi lại, then không cộng thêm (điểm cộng bằng 0, tổng điểm giữ nguyên).
- **PTS-AC-03** Given chấm, when đúng thì kết quả có điểm vừa cộng và tổng điểm; khi sai hoặc AI lỗi thì không có điểm.
- **PTS-AC-04** Given người dùng, when lấy tổng điểm, then trả điểm của chính họ; chưa đăng nhập thì báo chưa đăng nhập và không đọc kho.
- **PTS-AC-05** Given kho điểm trên cơ sở dữ liệu, when đọc, then lấy cột `points` của hồ sơ theo người dùng; không có hồ sơ là 0; lỗi báo lỗi hạ tầng không lộ nội dung gốc.
- **PTS-AC-06** `manual` Thanh điều hướng có huy hiệu điểm (cạnh credit), cập nhật ngay khi làm đúng; phản hồi đúng có "+10 điểm" ở lần đầu và không có ở lần lặp lại.
- **PTS-AC-07** `manual` Làm đúng câu cuối của một cặp thì pháo hoa phủ toàn màn hình vài giây, không chặn thao tác; vào lại cặp đã xong thì không có pháo hoa.
- **PTS-AC-10** `manual` Làm đúng một câu (không phải câu cuối của cặp) lần đầu thì có đợt pháo hoa ngắn khoảng hai giây, không chặn thao tác; làm sai, hoặc chuyển sang câu khác thì không có (hoặc dừng ngay); chọn giảm chuyển động thì không có pháo hoa. *Kiểm tra:* làm đúng vài câu liên tiếp, thử cả chế độ sáng và tối.
- **PTS-AC-08** `manual` Dùng được ở 390px không cuộn ngang, đủ chữ Tiếng Việt và English; người chọn giảm chuyển động không thấy pháo hoa.
- **PTS-AC-09** `manual` Given người học, when tự cộng điểm hoặc ghi hoàn thành bằng phiên của mình, then bị từ chối. *Kiểm tra:* lệnh SQL trong `docs/ai-grading-setup.md`.

## 6. Ràng buộc phi chức năng & bảo mật
- Hàm `complete_sentence` chỉ chạy được bằng khóa `service_role`; cần `SUPABASE_SERVICE_ROLE_KEY` ở máy chủ.
- Người học không có quyền chèn vào lịch sử hoàn thành; chỉ đọc dòng của mình.
- Không ghi log nội dung câu trả lời.
