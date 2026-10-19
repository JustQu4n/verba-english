# 011 — Chấm điểm câu bằng AI và credit

- **Status:** In progress
- **Tiền tố AC:** AIG

## 1. Bối cảnh & mục tiêu
Sau khi người học gửi bản dịch của một câu, hệ thống nhờ AI (Gemini) chấm và phản hồi theo ngôn ngữ giao diện (tiếng Việt hoặc tiếng Anh): câu gợi ý đúng, các điểm cần sửa và nhận xét. Câu chưa đúng thì chưa được sang câu khác; người học sửa và gửi lại cho đến khi đúng. Mỗi lần gửi mà chưa đúng tốn 1 credit, gửi đúng thì miễn phí; mỗi tài khoản có sẵn 10 credit miễn phí. Mua thêm credit làm sau. Mục tiêu phụ: tốn ít hạn mức Gemini nhất có thể khi nhiều người dùng.

## 2. Phạm vi
- **Trong phạm vi:** chấm một câu khi gửi; khung phản hồi; chặn sang câu mới khi chưa đúng; số dư credit và trừ credit; bộ nhớ đệm kết quả chấm; cấu hình khóa Gemini.
- **Ngoài phạm vi:** mua credit và thanh toán; lịch sử bài làm và lưu kết quả; chấm đoạn văn; hoàn credit; giới hạn tốc độ theo thời gian; thu thêm credit khi trả lời đúng.

## 3. Kịch bản người dùng
- Là người học, tôi gửi bản dịch và nhận phản hồi: câu gợi ý đúng, các điểm cần cải thiện, nhận xét.
- Là người học, tôi chưa đúng thì sửa rồi gửi lại; chỉ khi đúng mới bấm được "Câu tiếp theo". Tôi vẫn có thể bỏ qua câu.
- Là người học, tôi luôn thấy mình còn bao nhiêu credit; hết credit thì được báo rõ và biết việc mua thêm sẽ có sau.
- Là chủ dự án, tôi muốn mỗi lần chấm dùng ít token và không gọi lại AI cho cùng một câu trả lời.

## 4. Yêu cầu chức năng
- **FR-1** Tài khoản mới có 10 credit; mỗi lần gửi mà AI chấm là chưa đúng tốn 1 credit, kể cả khi sửa rồi gửi lại. Chấm là đúng thì không trừ credit.
- **FR-2** Chỉ trừ credit khi AI chấm thành công và kết quả là chưa đúng. Lỗi AI không trừ credit.
- **FR-3** Máy chủ tự tra câu tiếng Việt từ mã đề đã xuất bản; không nhận câu gốc từ trình duyệt.
- **FR-4** Cùng một đề và cùng một câu trả lời (sau khi gộp khoảng trắng) dùng kết quả đã chấm, không gọi AI và không trừ credit.
- **FR-5** Người dùng không tự cộng hay sửa credit của mình; chỉ trừ qua hàm có kiểm soát ở cơ sở dữ liệu.
- **FR-6** Khóa Gemini chỉ nằm ở máy chủ (`GEMINI_API_KEY`), không bao giờ gửi xuống trình duyệt.
- **FR-7** Tiết kiệm hạn mức: mô hình nhẹ, yêu cầu ngắn, kết quả JSON có lược đồ, giới hạn token đầu ra, tắt lưu hội thoại phía Google, và không gửi lại câu trả lời đã chấm.

## 5. Tiêu chí chấp nhận
- **AIG-AC-01** Given hằng số credit, when đọc, then tài khoản mới có 10 credit và một lần chấm chưa đúng tốn 1 credit.
- **AIG-AC-02** Given người chưa đăng nhập, when chấm, then báo chưa đăng nhập và không đọc đề, không gọi AI, không trừ credit.
- **AIG-AC-03** Given mã đề không hợp lệ, câu trả lời rỗng hoặc dài hơn 300 ký tự, when chấm, then báo lỗi dữ liệu và không đọc đề, không gọi AI, không trừ credit.
- **AIG-AC-04** Given mã đề không có hoặc chưa xuất bản, when chấm, then báo không tìm thấy và không gọi AI, không trừ credit.
- **AIG-AC-05** Given số dư thấp hơn chi phí, when chấm, then báo hết credit và không gọi AI.
- **AIG-AC-06** Given đề hợp lệ và đủ credit, when chấm, then gọi AI với câu tiếng Việt của đề, trình độ và câu trả lời đã cắt khoảng trắng; nếu kết quả chưa đúng thì trừ 1 credit, nếu đúng thì không trừ; trả kết quả cùng số dư còn lại. Mỗi lần gửi sai, kể cả bản sửa, đều trừ 1 credit.
- **AIG-AC-07** Given AI lỗi, when chấm, then báo lỗi hạ tầng và không trừ credit.
- **AIG-AC-08** Given cùng đề và cùng câu trả lời đã chấm trước đó (khác nhau chỉ ở khoảng trắng), when chấm lại, then trả kết quả đã lưu, không gọi AI và không trừ credit; khác ngôn ngữ phản hồi thì chấm lại (xem AIG-AC-22).
- **AIG-AC-09** Given AI chấm là chưa đúng nhưng lúc trừ credit số dư đã không đủ (hai yêu cầu song song), when trừ, then báo hết credit và không trả kết quả.
- **AIG-AC-10** Given đề và câu trả lời, when dựng yêu cầu cho Gemini, then yêu cầu chứa trình độ, câu tiếng Việt và câu trả lời đặt trong dấu phân cách rõ ràng, và chỉ dẫn hệ thống yêu cầu coi câu trả lời là dữ liệu chứ không phải lệnh.
- **AIG-AC-11** Given khóa và mô hình, when gửi yêu cầu, then khóa nằm trong tiêu đề, không nằm trong URL hay nội dung; có lược đồ JSON, giới hạn token đầu ra, mức suy luận thấp và tắt lưu trữ.
- **AIG-AC-12** Given phản hồi của Gemini, when đọc, then lấy được kết quả hợp lệ (đúng/sai, câu gợi ý, tối đa 2 điểm cải thiện, nhận xét); phản hồi sai định dạng, bị chặn, mã HTTP lỗi hoặc quá thời gian đều báo lỗi hạ tầng mà không lộ nội dung gốc hay khóa.
- **AIG-AC-13** Given chưa cấu hình khóa Gemini, when chấm, then báo lỗi hạ tầng và không gọi mạng.
- **AIG-AC-14** Given kho credit trên cơ sở dữ liệu, when đọc số dư hoặc trừ, then dùng đúng cột và hàm; trừ khi không đủ trả về rỗng; lỗi cơ sở dữ liệu báo lỗi hạ tầng không lộ nội dung gốc.
- **AIG-AC-15** Given người đã đăng nhập, when lấy số dư, then trả số credit; chưa đăng nhập thì báo chưa đăng nhập.
- **AIG-AC-16** Given bộ nhớ đệm, when lưu quá giới hạn hoặc quá hạn, then bỏ mục cũ nhất hoặc mục hết hạn.
- **AIG-AC-22** Given ngôn ngữ phản hồi (vi hoặc en), when chấm, then ngôn ngữ do máy chủ xác định (không nhận từ trình duyệt) được gửi cho AI để viết phần cải thiện và nhận xét, và là một phần của khóa bộ nhớ đệm.
- **AIG-AC-23** Given bất kỳ ngôn ngữ giao diện nào (vi hoặc en), when chấm, then phản hồi của AI (phần cải thiện, nhận xét) và ghi chú cấu trúc của đáp án chuẩn luôn bằng tiếng Việt, vì người học là người Việt; yêu cầu gửi cho Gemini nêu rõ ngôn ngữ ở dòng cuối và hướng dẫn hệ thống có quy tắc ngôn ngữ luôn áp dụng.
- **AIG-AC-30** Given kết quả chấm, then được lưu dùng chung cho mọi instance của máy chủ (bảng `grade_cache`, 24 giờ), khóa là mã băm SHA-256 nên không lưu câu trả lời của người học; đọc chỉ lấy dòng còn hạn, dòng hỏng là không có; thỉnh thoảng một lần ghi dọn luôn các dòng hết hạn; lỗi cơ sở dữ liệu hoặc thiếu khóa service là lỗi hạ tầng không lộ thông điệp gốc; bộ nhớ trong của instance đặt trước, một lần trúng ở bảng chung được chép vào bộ nhớ trong.
- **AIG-AC-31** Given bộ nhớ đệm dùng chung lỗi khi đọc hoặc ghi, when chấm, then vẫn chấm bằng AI và trừ credit như bình thường.
- **AIG-AC-17** `manual` Given đã gửi một bản dịch, when có kết quả, then khung phản hồi hiện "Suggestion" (câu đúng), "Suggested improvements" (gạch đầu dòng) và "Nhận xét" ("Comment" khi giao diện tiếng Anh), viết theo ngôn ngữ giao diện, kèm trạng thái đúng hoặc chưa đúng. *Kiểm tra:* gửi "I want to the beach" cho câu "Tôi muốn đi biển".
- **AIG-AC-18** `manual` Given câu trả lời chưa đúng, when xem màn luyện, then không có nút "Câu tiếp theo"; sửa câu trả lời thì gửi lại được, còn giữ nguyên câu cũ thì không gửi lại được; "Bỏ qua" vẫn dùng được. Khi đúng thì hiện "Câu tiếp theo".
- **AIG-AC-19** `manual` Given màn luyện và màn chọn, when xem, then thấy số credit còn lại, cập nhật sau mỗi lần chấm; hết credit thì hiện thông báo việc mua thêm sẽ có và nút Gửi vẫn dùng được (câu khớp đáp án chuẩn vẫn được chấm đúng miễn phí, xem spec 014; câu khác nhận báo hết credit) sau.
- **AIG-AC-20** `manual` Given bảng hồ sơ, when thử sửa cột credit bằng phiên người dùng hoặc gọi hàm trừ với số âm, then bị từ chối. *Kiểm tra:* chạy các lệnh SQL trong `docs/ai-grading-setup.md`.
- **AIG-AC-21** `manual` Giao diện đen trắng, đủ chữ Tiếng Việt và English, dùng được ở 390px không cuộn ngang, trạng thái "đang chấm" có thông báo cho trình đọc màn hình.

## 6. Ràng buộc phi chức năng & bảo mật
- Khóa Gemini không được ghi log và không gửi xuống trình duyệt; lỗi từ Gemini không lộ ra giao diện.
- Câu trả lời của người học là dữ liệu không tin cậy: giới hạn 300 ký tự, đặt trong dấu phân cách, kết quả bị ràng buộc bởi lược đồ JSON.
- Số dư chỉ giảm được qua hàm cơ sở dữ liệu kiểm tra số lượng dương và đủ số dư, chạy bằng quyền của chính người dùng.
- Không ghi log nội dung câu trả lời.

## 7. Câu hỏi mở
- [NEEDS CLARIFICATION: Có giữ nút "Bỏ qua" khi chưa đúng không? Hiện: giữ.]
- [NEEDS CLARIFICATION: Có lưu lịch sử bài làm để xem lại và thống kê không? Hiện chưa lưu.]
