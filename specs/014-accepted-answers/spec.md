# 014 — Đáp án chuẩn và chấm không cần AI

- **Status:** In progress
- **Tiền tố AC:** ANS

## 1. Bối cảnh & mục tiêu
AI có giới hạn quota. Phần lớn lượt gửi là câu đúng, nên mỗi đề có thể lưu vài đáp án chuẩn kèm gợi ý cấu trúc ngữ pháp do quản trị viên nhập (hoặc nhờ AI soạn sẵn rồi duyệt). Câu của người học khớp một đáp án chuẩn thì được chấm đúng ngay, miễn phí, không gọi AI, và vẫn nhận điểm. Nhờ đó người học vẫn làm bài được khi AI hết quota.

## 2. Phạm vi
- **Trong phạm vi:** lưu đáp án chuẩn cho từng đề (tối đa 5), mỗi đáp án có gợi ý cấu trúc bằng Tiếng Việt và English; nhập ở form admin; dữ liệu mẫu có sẵn đáp án chuẩn cho 60 câu seed; nút "Gợi ý bằng AI" để soạn sẵn đáp án và cấu trúc; chấm đối chiếu đáp án chuẩn trước khi gọi AI; hiển thị gợi ý cấu trúc ở phản hồi.
- **Ngoài phạm vi:** nhập hàng loạt từ file; tự thêm câu đã được AI chấm đúng vào đáp án chuẩn; chấm sai bằng đối chiếu (câu không khớp vẫn do AI chấm).

## 3. Kịch bản người dùng
- Là quản trị viên, tôi thêm vài cách dịch đúng cho một đề, mỗi cách kèm ghi chú cấu trúc ngữ pháp.
- Là quản trị viên, tôi bấm "Gợi ý bằng AI" để AI soạn sẵn đáp án và cấu trúc, rồi tôi sửa và lưu.
- Là người học, tôi viết đúng một đáp án chuẩn (bất kể hoa thường, dấu câu) thì được báo đúng ngay, nhận +10 điểm và thấy cấu trúc ngữ pháp, kể cả khi hết credit hay AI đang lỗi.
- Là người học, tôi không bao giờ xem được danh sách đáp án chuẩn trước khi làm bài.

## 4. Yêu cầu chức năng
- **FR-1** So khớp không phân biệt hoa thường, bỏ dấu câu và khoảng trắng thừa; từ khác nhau thì không khớp. Dấu nháy trong từ (I'm) được giữ.
- **FR-2** Khớp đáp án chuẩn thì: đúng, miễn phí, không gọi AI, ghi "đã xong" và cộng điểm như spec 013. Phản hồi gồm đáp án gợi ý và cấu trúc theo ngôn ngữ giao diện.
- **FR-3** Không khớp thì chấm bằng AI như cũ (spec 011). Lỗi khi đọc đáp án chuẩn không chặn việc chấm: bỏ qua đáp án chuẩn và dùng AI.
- **FR-4** Đáp án chuẩn chỉ đọc được bởi quản trị viên và máy chủ; học viên không đọc được qua API.
- **FR-6** Khi gửi bài, người học chọn cách chấm: **AI** (nhận xét chi tiết, sai thì trừ 1 credit như spec 011) hoặc **Đáp án chuẩn** (đối chiếu đáp án chuẩn của đề, miễn phí, không gọi AI). Mặc định là AI. Ở cả hai cách, câu khớp đáp án chuẩn đều đúng ngay như FR-2.
- **FR-7** Ở cách Đáp án chuẩn, câu không khớp là chưa đúng: không gọi AI, không trừ credit, không ghi hoàn thành; phản hồi hiện đáp án chuẩn gần nhất với câu của người học kèm cấu trúc ngữ pháp của đáp án đó, và mời đổi sang chấm bằng AI để kiểm tra cách diễn đạt khác. Đề chưa có đáp án chuẩn thì báo rõ là chưa có. Lỗi khi đọc đáp án chuẩn ở cách này được báo là lỗi, không tự chuyển sang AI.
- **FR-5** "Gợi ý bằng AI" chỉ dành cho quản trị viên, tốn quota Gemini (không tốn credit học viên), trả tối đa 3 đáp án để admin duyệt; không tự lưu.

## 5. Tiêu chí chấp nhận
- **ANS-AC-01** Given hai câu chỉ khác hoa thường, dấu câu, khoảng trắng hoặc kiểu dấu nháy, when so khớp, then coi là một; câu khác từ thì khác.
- **ANS-AC-02** Given danh sách đáp án chuẩn, when tìm đáp án khớp, then trả đáp án khớp đầu tiên, hoặc không có khi không khớp hay danh sách rỗng.
- **ANS-AC-03** Given đáp án có cấu trúc, when lấy ghi chú theo ngôn ngữ, then trả từng dòng không rỗng của đúng ngôn ngữ; cấu trúc rỗng thì không có ghi chú.
- **ANS-AC-04** Given câu khớp đáp án chuẩn, when chấm, then trả đúng với đáp án gợi ý và ghi chú cấu trúc theo ngôn ngữ giao diện, không gọi AI, không trừ credit, ghi hoàn thành và cộng điểm.
- **ANS-AC-05** Given người học hết credit, when gửi câu khớp đáp án chuẩn, then vẫn được chấm đúng; câu không khớp vẫn báo hết credit.
- **ANS-AC-06** Given cách chấm AI, when câu không khớp hoặc đề chưa có đáp án chuẩn hoặc kho đáp án chuẩn lỗi, then chấm bằng AI như cũ.
- **ANS-AC-07** Given kho đề của admin, when lưu hoặc đọc đề, then đáp án chuẩn được ghi vào bảng `prompt_answers` và đọc kèm đề; đề chưa có đáp án thì trả danh sách rỗng; lỗi cơ sở dữ liệu báo lỗi hạ tầng không lộ nội dung gốc.
- **ANS-AC-08** Given kho đáp án chuẩn phía học viên, when đọc đáp án của một đề, then dùng quyền máy chủ, chỉ đọc đề đó, trả rỗng khi chưa có, lỗi thì báo lỗi hạ tầng.
- **ANS-AC-09** Given dữ liệu form, when kiểm tra, then đáp án là tùy chọn; tối đa 5; mỗi đáp án bắt buộc có chữ và tối đa 300 ký tự; mỗi cấu trúc tối đa 500 ký tự; nội dung được cắt khoảng trắng đầu cuối.
- **ANS-AC-10** Given form admin, when đọc dữ liệu gửi lên, then ghép đúng các dòng đáp án, bỏ dòng hoàn toàn trống, và giữ nguyên khi lưu lỗi.
- **ANS-AC-11** Given người dùng, when yêu cầu AI gợi ý đáp án, then chỉ admin được phép, dữ liệu được kiểm tra, trả tối đa 3 đáp án; chưa đăng nhập hoặc không phải admin thì bị từ chối và không gọi AI.
- **ANS-AC-12** Given bộ gợi ý bằng Gemini, when gọi, then gửi câu tiếng Việt và trình độ, đọc JSON trả về thành đáp án và cấu trúc; thiếu khóa hoặc trả lời không dùng được thì báo lỗi hạ tầng không lộ nội dung.
- **ANS-AC-18** Given cách chấm Đáp án chuẩn và câu khớp một đáp án chuẩn, when chấm, then đúng như ANS-AC-04 (miễn phí, ghi hoàn thành, cộng điểm), kể cả khi hết credit.
- **ANS-AC-19** Given cách chấm Đáp án chuẩn và câu không khớp, when chấm, then trả chưa đúng kèm đáp án chuẩn gần nhất với câu đó và cấu trúc ngữ pháp của nó theo ngôn ngữ giao diện (rỗng nếu đề chưa có đáp án), không gọi AI, không trừ credit, không ghi hoàn thành, số dư giữ nguyên.
- **ANS-AC-23** Given danh sách đáp án chuẩn, when tìm đáp án gần nhất với một câu, then trả đáp án có nhiều từ trùng nhất (không phân biệt hoa thường, dấu câu); bằng nhau thì lấy đáp án đứng trước; danh sách rỗng thì không có.
- **ANS-AC-20** Given cách chấm Đáp án chuẩn và kho đáp án chuẩn lỗi, when chấm, then báo lỗi hạ tầng, không gọi AI.
- **ANS-AC-21** Given dữ liệu gửi lên không nêu cách chấm hoặc nêu cách chấm không hợp lệ, when chấm, then mặc định là AI; giá trị lạ bị từ chối.
- **ANS-AC-22** `manual` Cạnh nút Gửi có nút gạt (toggle) "Chấm bài bằng": **AI** và **Đáp án chuẩn**, một dòng mô tả ngắn đổi theo lựa chọn; chọn lại cách chấm cho phép gửi lại đúng câu vừa chấm; lựa chọn giữ nguyên khi sang câu khác; chấm bằng Đáp án chuẩn khi chưa khớp thì hiện đáp án chuẩn gần nhất cùng cấu trúc ngữ pháp và mời chọn AI; đề chưa có đáp án chuẩn thì hiện thông báo chưa có. *Kiểm tra:* gửi một câu sai ở hai cách, rồi một câu đúng; thử với đề chưa có đáp án chuẩn.
- **ANS-AC-13** `manual` Form admin có mục "Đáp án chuẩn": thêm, xóa (tối đa 5), mỗi dòng gồm đáp án English và cấu trúc Tiếng Việt, English; nút "Gợi ý bằng AI" điền thêm các dòng để duyệt; lưu rồi mở lại thấy đủ. *Kiểm tra:* thêm, xóa, bấm nút AI, lưu, mở lại.
- **ANS-AC-14** `manual` Người học gửi đúng một đáp án chuẩn thì thấy "Chính xác", "+10 điểm" và mục "Cấu trúc ngữ pháp" theo ngôn ngữ giao diện, không có lời nhận xét AI; hoạt động khi hết credit. *Kiểm tra:* gửi câu khớp (viết thường, bỏ dấu chấm) với credit bằng 0.
- **ANS-AC-15** `manual` Given người học, when đọc bảng `prompt_answers` bằng phiên của mình, then không thấy dòng nào. *Kiểm tra:* lệnh SQL trong `docs/ai-grading-setup.md`.
- **ANS-AC-16** `manual` Form admin và phản hồi dùng được ở 390px không cuộn ngang, đủ chữ Tiếng Việt và English.
- **ANS-AC-17** Given tệp dữ liệu mẫu `supabase/seed.sql`, when kiểm tra, then mỗi câu mẫu có đáp án chuẩn (tối đa 5, không trùng sau khi chuẩn hóa) kèm cấu trúc ngữ pháp Tiếng Việt và English, trong giới hạn độ dài.

## 6. Ràng buộc phi chức năng & bảo mật
- Bảng `prompt_answers` bật RLS, chỉ admin đọc và ghi; học viên không có chính sách nào. Máy chủ đọc bằng khóa `service_role`.
- Không ghi log nội dung câu trả lời.
- Xóa đề thì đáp án chuẩn bị xóa theo (xóa theo tầng).

## 7. Câu hỏi mở
- [NEEDS CLARIFICATION: Có cần đưa câu mà AI chấm đúng vào danh sách đáp án chuẩn để lần sau khỏi gọi AI không? Hiện chưa làm; bộ nhớ đệm trong máy chủ đã giúp phần nào.]
