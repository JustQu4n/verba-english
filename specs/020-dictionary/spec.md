# 020 — Từ điển nhanh và từ vựng đã lưu

- **Status:** Implemented
- **Tiền tố AC:** DIC
- **Tác giả / ngày:** 2026-10-19

## 1. Bối cảnh & mục tiêu
Khi viết câu hoặc đọc gợi ý của AI, người học gặp từ chưa biết. Họ bôi đen từ đó, một popup hiện nghĩa tiếng Việt ngay tại chỗ, và có thể lưu từ vào danh sách riêng để ôn lại sau. Thành công là tra được một từ trong chưa đầy một lần bấm và không phải rời trang luyện viết.

## 2. Phạm vi
- **Trong:** popup khi bôi đen từ trong ô trả lời và trong phần "Gợi ý"/"Cải thiện" của phản hồi AI; tra cache trước rồi mới gọi API từ điển; lưu và bỏ lưu từ; trang "Từ vựng của tôi" liệt kê từ đã lưu; phát âm bằng audio của API.
- **Trong (thêm):** lưu cả từ mà từ điển không có (chưa có nghĩa); trang từ vựng có ô nhập từ và nút "AI dịch nghĩa" để AI viết nghĩa, lưu từ và trừ credit.
- **Ngoài:** ôn tập kiểu thẻ ghi nhớ hoặc lặp lại ngắt quãng, tra ngược Việt sang Anh, tra từ ở các trang khác ngoài trang luyện viết.

## 3. Yêu cầu chức năng
- **FR-1** Tra từ và lưu từ yêu cầu đăng nhập, để API từ điển không bị gọi bởi người lạ.
- **FR-2** Từ được làm sạch trước khi dùng: bỏ dấu câu hai đầu, gộp khoảng trắng, chữ thường, tối đa 60 ký tự, chỉ gồm chữ cái, dấu nháy đơn, gạch nối và khoảng trắng.
- **FR-3** Thứ tự tra: bộ nhớ đệm trong cơ sở dữ liệu (30 ngày; từ mà từ điển không có được nhớ 1 giờ), rồi API từ điển (`def_lang=vi`). Kết quả mới được ghi vào bộ nhớ đệm. Bộ nhớ đệm hỏng hoặc không ghi được không làm hỏng việc tra từ.
- **FR-4** Nghĩa tiếng Việt do API trả về được hiển thị trực tiếp, xếp trước các nghĩa khác.
- **FR-5** Lưu từ chỉ nhận từ; nội dung nghĩa do máy chủ lấy lại từ cache hoặc API, không tin dữ liệu của trình duyệt.
- **FR-7** Từ mà từ điển không có vẫn lưu được, không có nghĩa; người học có thể nhờ AI dịch nghĩa sau.
- **FR-8** "AI dịch nghĩa" tốn 1 credit và chỉ trừ SAU KHI AI trả về kết quả dùng được: AI lỗi, hết credit hoặc văn bản không phải từ tiếng Anh thì không tốn gì và không lưu gì. Thành công thì từ được lưu (thay bản cũ nếu có) với nguồn `ai`.
- **FR-6** Mỗi người chỉ thấy và sửa từ đã lưu của chính mình; lưu hai lần cùng một từ chỉ giữ một dòng. Bảng bộ nhớ đệm chỉ máy chủ đọc được.

## 4. Tiêu chí chấp nhận
- **DIC-AC-01** Given một chuỗi bôi đen, when làm sạch, then bỏ dấu câu hai đầu, gộp khoảng trắng, đổi chữ thường; chuỗi rỗng, quá 60 ký tự, có chữ số hoặc ký hiệu lạ bị từ chối bằng mã `invalid_word`.
- **DIC-AC-02** Given khách, when tra hoặc lưu hoặc bỏ lưu hoặc xem danh sách, then bị từ chối và không chạm kho dữ liệu hay API.
- **DIC-AC-03** Given từ có trong bộ nhớ đệm, when tra, then trả kết quả và không gọi API.
- **DIC-AC-04** Given từ chưa có trong cache, when tra, then gọi API, ghi vào cache và trả kết quả; cache lỗi khi đọc hoặc ghi vẫn trả kết quả.
- **DIC-AC-05** Given API không có từ đó, when tra, then trả mục rỗng (không lỗi) kèm cờ đã lưu, và không ghi cache; API lỗi là lỗi hạ tầng.
- **DIC-AC-06** Given kết quả tra, then kèm cờ đã lưu của người dùng hiện tại.
- **DIC-AC-07** Given từ tra được, when lưu, then lưu bản chụp nội dung lấy từ cache hoặc API; từ không có trong từ điển vẫn được lưu riêng, không có nghĩa (nguồn `manual`) và không ghi cache.
- **DIC-AC-08** Given từ đã lưu, when bỏ lưu, then xóa đúng từ của người dùng; when xem danh sách, then nhận từ mới lưu trước.
- **DIC-AC-09** Given phản hồi của API từ điển, then chuyển thành mục từ: chọn kết quả tiếng Anh, nghĩa tiếng Việt xếp trước, tối đa 5 nghĩa, phiên âm ưu tiên dạng có dấu `/ /`, audio thành địa chỉ đầy đủ; `exists:false`, 404 hoặc không có nghĩa nào là không tìm thấy; lỗi mạng, quá thời gian, mã lỗi khác hoặc JSON hỏng là lỗi hạ tầng không lộ thông điệp gốc.
- **DIC-AC-10** Given kho dữ liệu, then bộ nhớ đệm đọc đúng từ và bỏ bản quá 30 ngày, ghi bằng upsert; từ đã lưu được lưu, đọc, xóa theo người dùng; lỗi cơ sở dữ liệu hoặc thiếu khóa service là lỗi hạ tầng không lộ thông điệp gốc; dữ liệu hỏng bị bỏ qua thay vì làm hỏng cả danh sách.
- **DIC-AC-11** Given đường dẫn `/api/dictionary`, then lỗi được đổi thành mã HTTP (400, 401) và từ thiếu hoặc sai là 400; từ không có trong từ điển trả 200 với mục rỗng.
- **DIC-AC-12** `manual` Bôi đen một từ trong ô trả lời hoặc trong phần Gợi ý/Cải thiện thì popup hiện cạnh từ: từ, phiên âm, loại từ, nghĩa tiếng Việt, ví dụ nếu có, nút phát âm và nút Lưu. Esc, bấm ra ngoài hoặc bôi đen chỗ khác thì đóng. *Kiểm tra:* thử trên máy tính và ở 390px.
- **DIC-AC-13** `manual` Nút Lưu đổi thành "Đã lưu" và bấm lại sẽ bỏ lưu; lỗi mạng hiện thông báo trong popup mà không làm mất nội dung ô trả lời. *Kiểm tra:* lưu, bỏ lưu, rồi tắt mạng và thử lại.
- **DIC-AC-14** `manual` Trang `/dashboard/vocabulary` (mục "Từ vựng của tôi" trong menu tài khoản) liệt kê từ đã lưu, mới nhất trước, có nghĩa, phiên âm, nút phát âm và nút bỏ lưu; trống thì có lời mời luyện viết. *Kiểm tra:* lưu hai từ rồi mở trang.
- **DIC-AC-15** `manual` Given migration `0018_dictionary.sql`, then người dùng chỉ đọc, thêm, xóa được từ của mình bằng khóa anon, và không đọc được bảng cache. *Kiểm tra:* gọi từ trình duyệt bằng hai tài khoản khác nhau.
- **DIC-AC-16** Given người đăng nhập, when AI dịch nghĩa một từ, then khách bị từ chối, từ sai bị từ chối bằng mã `invalid_word`, hết credit thì không gọi AI, thành công thì lưu từ với nguồn `ai` rồi trừ 1 credit và trả số dư mới; AI lỗi hoặc không có nghĩa dùng được (mã `cannot_translate`) thì không trừ và không lưu; thua cuộc đua giành credit cuối thì trả lại bản đã lưu trước đó hoặc xóa từ mới. Qua `/api/dictionary/translate`: 200, 400, 401, 402.
- **DIC-AC-17** Given phản hồi của Gemini, then chuyển thành mục: tối đa 3 nghĩa tiếng Việt, bỏ nghĩa rỗng, cắt khoảng trắng, phiên âm rỗng là null; JSON sai dạng, lỗi mạng hoặc thiếu khóa là lỗi hạ tầng không lộ thông điệp gốc; từ được gửi như dữ liệu.
- **DIC-AC-18** `manual` Trang "Từ vựng của tôi" có ô nhập từ và nút "AI dịch nghĩa" (ghi rõ tốn 1 credit); bấm thì từ hiện đầu danh sách kèm nghĩa, số credit ở thanh trên cập nhật; hết credit, từ sai hoặc AI lỗi hiện thông báo dưới ô mà không mất chữ đã nhập. Từ chưa có nghĩa hiện nút "AI dịch nghĩa" ngay trên thẻ. *Kiểm tra:* thêm một từ thật, một chuỗi vô nghĩa (không tốn credit), rồi thử khi còn 0 credit.
- **DIC-AC-19** `manual` Bôi đen một từ không có trong từ điển (ví dụ `asdfgh`) thì popup báo không có trong từ điển và vẫn có nút Lưu; từ đó hiện ở trang từ vựng với dòng "Chưa có nghĩa". *Kiểm tra:* thử trong ô trả lời.
- **DIC-AC-20** Given một từ mà từ điển không có, when tra lần đầu, then kết quả "không có" được ghi vào cache (entry rỗng); when tra lại trong vòng 1 giờ, then trả ngay và không gọi API; quá 1 giờ thì hỏi lại. Lỗi của API từ điển không bao giờ được ghi vào cache.
- **DIC-AC-21** Given hai người tra cùng một từ mới cùng lúc trên một instance, then chỉ gọi API từ điển một lần; xong thì quên lần gọi đó, lần tra sau hỏi lại bình thường.
- **DIC-AC-22** Given một lần ghi cache từ điển, then thỉnh thoảng (khoảng 1 trên 50 lần) xóa luôn các dòng đã hết hạn (từ có nghĩa quá 30 ngày, từ "không có" quá 1 giờ) để bảng không lớn mãi.
