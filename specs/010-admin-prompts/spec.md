# 010 — Quản trị đề bài (Admin → Prompts)

- **Status:** In progress
- **Tiền tố AC:** APR

## 1. Bối cảnh & mục tiêu
Đề bài luyện viết câu nằm trong cơ sở dữ liệu, ban đầu được nạp từ tệp dữ liệu mẫu `supabase/seed.sql`. Người quản trị cần tự thêm, sửa, xóa và quyết định đề nào được đưa tới người học, mà không phải nhờ lập trình viên. Người quản trị đăng nhập bằng email và mật khẩu như mọi tài khoản khác; quyền quản trị là một thuộc tính của hồ sơ, không ai tự cấp cho mình được.

## 2. Phạm vi
- **Trong phạm vi:** quyền quản trị; khu Admin chỉ dành cho quản trị viên; danh sách đề (lọc, tìm kiếm, phân trang); tạo, sửa, xóa đề câu; xuất bản hoặc để bản nháp; màn luyện câu dùng đề đã xuất bản; giao diện đen trắng, hai ngôn ngữ.
- **Ngoài phạm vi:** đề dạng đoạn văn (Paragraph); nhập hàng loạt từ tệp; lịch sử chỉnh sửa; phân quyền theo chủ đề; trang quản lý người dùng hay cấp quyền quản trị bằng giao diện.

## 3. Kịch bản người dùng
- Là quản trị viên, tôi xem danh sách đề, lọc theo trình độ, chủ đề, trạng thái và tìm theo nội dung.
- Là quản trị viên, tôi thêm một đề mới gồm câu tiếng Việt, gợi ý từ khóa tiếng Anh, trình độ, chủ đề, và chọn xuất bản hay lưu nháp.
- Là quản trị viên, tôi sửa hoặc xóa một đề sau khi xác nhận.
- Là người học, tôi chỉ thấy các đề đã xuất bản khi luyện câu.
- Là người dùng thường, tôi không vào được khu Admin và không thể tự nâng quyền.

## 4. Yêu cầu chức năng
- **FR-1** Mỗi hồ sơ có một vai trò: người dùng hoặc quản trị viên; mặc định là người dùng.
- **FR-2** Mọi thao tác quản trị đề yêu cầu đăng nhập và vai trò quản trị viên; thiếu một trong hai thì bị từ chối trước khi chạm tới dữ liệu.
- **FR-3** Câu tiếng Việt dài 1–300 ký tự, gợi ý dài 1–200 ký tự (sau khi bỏ khoảng trắng hai đầu); trình độ và chủ đề phải thuộc danh mục của luyện câu.
- **FR-4** Đề mới mặc định là bản nháp.
- **FR-5** Danh sách phân trang, mới nhất trước; có bộ lọc trình độ, chủ đề, trạng thái và ô tìm kiếm theo câu tiếng Việt.
- **FR-6** Xóa đề cần xác nhận.
- **FR-7** Quyền ở tầng dữ liệu cũng chặn người không phải quản trị ghi đề; việc kiểm tra ở ứng dụng chỉ là lớp thứ hai.
- **FR-8** Khi một cặp trình độ và chủ đề chưa có đề đã xuất bản nào, luyện câu báo không có câu cho lựa chọn đó (không còn bộ câu mẫu trong mã nguồn).
- **FR-9** Tài khoản quản trị không dùng khu người học: mở `/dashboard` (hoặc trang con) sẽ được chuyển sang `/admin/prompts`. Người học giữ nguyên.

## 5. Tiêu chí chấp nhận
- **APR-AC-01** Given người chưa đăng nhập, when thực hiện bất kỳ thao tác quản trị đề (xem danh sách, xem một đề, tạo, sửa, xóa), then báo chưa đăng nhập và không truy cập kho đề.
- **APR-AC-02** Given người đã đăng nhập nhưng không phải quản trị viên, when thực hiện bất kỳ thao tác quản trị đề, then báo không đủ quyền và không truy cập kho đề.
- **APR-AC-03** Given hồ sơ có vai trò quản trị viên, when kiểm tra quyền, then được xác nhận là quản trị viên; hồ sơ vai trò người dùng, thiếu hồ sơ hoặc lỗi đọc hồ sơ thì không được xác nhận.
- **APR-AC-04** Given quản trị viên và dữ liệu hợp lệ, when tạo đề, then đề được lưu với nội dung đã bỏ khoảng trắng hai đầu và mặc định là bản nháp nếu không chọn xuất bản.
- **APR-AC-05** Given quản trị viên chọn xuất bản, when tạo đề, then đề được lưu ở trạng thái đã xuất bản.
- **APR-AC-06** Given dữ liệu không hợp lệ (câu rỗng hoặc quá 300 ký tự, gợi ý rỗng hoặc quá 200 ký tự, trình độ hoặc chủ đề ngoài danh mục), when tạo hoặc sửa đề, then báo lỗi dữ liệu theo từng ô và không ghi vào kho.
- **APR-AC-07** Given quản trị viên và mã đề tồn tại, when xem một đề, then trả đúng đề đó; mã không tồn tại thì báo không tìm thấy.
- **APR-AC-08** Given quản trị viên và dữ liệu hợp lệ, when sửa đề đang tồn tại, then đề được cập nhật; đề không tồn tại thì báo không tìm thấy.
- **APR-AC-09** Given quản trị viên, when xóa đề đang tồn tại, then đề bị xóa; đề không tồn tại thì báo không tìm thấy.
- **APR-AC-10** Given bộ lọc và trang, when xem danh sách, then kho nhận đúng bộ lọc đã chuẩn hóa (trang tối thiểu 1, mỗi trang 20 đề); giá trị lọc ngoài danh mục thì báo lỗi dữ liệu.
- **APR-AC-11** Given dòng dữ liệu từ kho, when chuyển thành đề, then các trường được ánh xạ đúng và thời gian là kiểu ngày giờ; lỗi kho báo lỗi hạ tầng và không lộ nội dung lỗi gốc.
- **APR-AC-12** Given luyện câu, when lấy đề theo trình độ và chủ đề, then chỉ trả các đề câu đã xuất bản của cặp đó; lỗi kho vẫn báo lỗi hạ tầng.
- **APR-AC-13** Given dữ liệu biểu mẫu tạo hoặc sửa đề, when đọc biểu mẫu, then chuyển thành dữ liệu đề (ô xuất bản được chọn là đã xuất bản, không chọn là bản nháp) và giữ nguyên chuỗi người dùng đã nhập để hiển thị lại khi có lỗi; lỗi dữ liệu theo từng ô, lỗi quyền hoặc không tìm thấy được chuyển thành mã lỗi để dịch.
- **APR-AC-14** `manual` Khu Admin chỉ mở được khi đã đăng nhập bằng tài khoản quản trị viên: khách bị chuyển về trang đăng nhập, người dùng thường thấy trang không tìm thấy, và quản trị viên có lối vào từ dashboard. *Kiểm tra:* thử ba loại tài khoản.
- **APR-AC-15** `manual` Danh sách đề hiển thị câu tiếng Việt, gợi ý, trình độ, chủ đề, trạng thái (Đã xuất bản hoặc Bản nháp) và ngày cập nhật; có bộ lọc, ô tìm kiếm và phân trang; khi không có kết quả hiện thông báo trống kèm nút thêm đề. *Kiểm tra:* thêm vài đề rồi thử từng bộ lọc.
- **APR-AC-16** `manual` Biểu mẫu tạo và sửa có bộ đếm ký tự, báo lỗi ngay cạnh từng ô khi dữ liệu sai, giữ nguyên nội dung đã nhập khi có lỗi, và sau khi lưu quay về danh sách kèm thông báo thành công. *Kiểm tra:* gửi biểu mẫu trống, gửi dữ liệu đúng.
- **APR-AC-17** `manual` Bấm Xóa mở hộp xác nhận nêu rõ câu sắp xóa; hủy thì không xóa, xác nhận thì xóa và quay về danh sách. *Kiểm tra:* thử hủy và xác nhận.
- **APR-AC-18** `manual` Đề đã xuất bản xuất hiện khi luyện câu đúng trình độ và chủ đề; đề nháp thì không; đổi từ xuất bản sang nháp thì biến mất. *Kiểm tra:* tạo đề, mở luyện câu, đổi trạng thái.
- **APR-AC-19** `manual` Người dùng thường không tự nâng quyền được: dùng chính phiên đăng nhập của họ để cập nhật vai trò hoặc ghi vào bảng đề đều bị từ chối. *Kiểm tra:* chạy lệnh cập nhật từ trình duyệt bằng khóa công khai và phiên người dùng thường, xem kết quả bị từ chối.
- **APR-AC-20** `manual` Giao diện đen trắng, dùng được ở chiều rộng 390px không cuộn ngang, focus nhìn rõ, đủ chữ Tiếng Việt và English. *Kiểm tra:* thu hẹp cửa sổ, dùng Tab, đổi ngôn ngữ.
- **APR-AC-21** `manual` Given tài khoản admin, when đăng nhập hoặc mở `/dashboard` hay `/dashboard/writing/sentence`, then được chuyển sang `/admin/prompts`; tài khoản người học vẫn vào dashboard bình thường và không thấy mục quản trị. *Kiểm tra:* đăng nhập bằng admin và bằng người học.
- **APR-AC-22** Given gợi ý từ khóa, when tách chữ, then chia theo dấu phẩy, chấm phẩy hoặc xuống dòng, cắt khoảng trắng, bỏ chữ rỗng và chữ lặp (không phân biệt hoa thường); lưu lại thành một chuỗi cách nhau bằng dấu phẩy, nên gợi ý cũ vẫn đọc được.
- **APR-AC-23** Given từ khóa có sẵn và từ khóa mới (ví dụ do AI gợi ý), when gộp, then từ khóa cũ đứng trước, bỏ chữ trùng, và dừng trước khi gợi ý vượt 200 ký tự.
- **APR-AC-24** `manual` Ô "Gợi ý từ khóa" nhận từng từ: nhấn Enter hoặc gõ dấu phẩy thì tách thành một nhãn (Enter không gửi form); dán chuỗi có dấu phẩy thì tách hết; Backspace khi ô trống xóa nhãn cuối; bấm dấu x trên nhãn để xóa; chữ đang gõ dở vẫn được lưu khi bấm Lưu. *Kiểm tra:* gõ "want" Enter, "go to," rồi dán "beach, swim"; bấm Lưu và mở lại.

## 6. Ràng buộc phi chức năng & bảo mật
- Vai trò chỉ đổi được bằng thao tác trực tiếp trên cơ sở dữ liệu của chủ dự án; không có đường nào từ giao diện hay từ phiên người dùng.
- Khu Admin không dùng khóa dịch vụ (service role); mọi thao tác chạy bằng phiên của chính quản trị viên và chịu quyền ở tầng dữ liệu.
- Nội dung đề không được ghi log.
- Thông điệp lỗi của cơ sở dữ liệu không lộ ra giao diện.

## 7. Câu hỏi mở
- [NEEDS CLARIFICATION: Có cần lưu người tạo và người sửa cuối cho mỗi đề không? Hiện chưa lưu.]
- [NEEDS CLARIFICATION: Xóa hẳn hay chỉ ẩn (xóa mềm)? Hiện xóa hẳn; đề đã xuất bản vẫn xóa được.]
