# 019 — Bảng điều khiển Admin

- **Status:** Implemented
- **Tiền tố AC:** ADM
- **Tác giả / ngày:** 2026-10-15

## 1. Bối cảnh & mục tiêu
Khu Admin chỉ có danh sách đề. Quản trị viên cần một bảng điều khiển đầy đủ: menu bên trái, xem tổng quan, quản lý đề, quản lý tài khoản người dùng và xem bảng xếp hạng của toàn bộ người dùng có phân trang. Thành công là tìm được một tài khoản, đổi vai trò, credit hoặc điểm chỉ với vài thao tác.

## 2. Phạm vi
- **Trong:** menu trái (Tổng quan, Prompts, Tài khoản, Bảng xếp hạng, về dashboard), menu thu gọn trên điện thoại; trang tổng quan; danh sách tài khoản (tìm, lọc vai trò, sắp xếp, phân trang 20/trang); sửa vai trò, credit, điểm của một tài khoản; bảng xếp hạng toàn bộ tài khoản có phân trang.
- **Ngoài:** xóa hoặc khóa tài khoản, tạo tài khoản, gửi email, nhật ký thao tác; đổi email hoặc mật khẩu của người khác.

## 3. Yêu cầu chức năng
- **FR-1** Mọi thao tác ở khu này yêu cầu đăng nhập và vai trò quản trị; thiếu một trong hai thì bị từ chối trước khi đọc hoặc ghi dữ liệu.
- **FR-2** Danh sách: mới nhất trước, 20 mỗi trang, tìm theo tên hoặc email (tối đa 100 ký tự), lọc theo vai trò, sắp xếp theo mới nhất, nhiều điểm, tên.
- **FR-3** Credit và điểm là số nguyên từ 0 đến 1.000.000 (credit) và 10.000.000 (điểm).
- **FR-4** Quản trị viên không đổi được vai trò của chính mình, để không ai tự khóa mình khỏi hệ thống.
- **FR-5** Thứ hạng: nhiều điểm hơn đứng trước, bằng điểm thì tài khoản tạo trước đứng trước; chưa có điểm thì chưa có hạng.
- **FR-6** Các hàm đọc tài khoản chỉ gọi được bằng khóa service role, không gọi được từ trình duyệt.

## 4. Tiêu chí chấp nhận
- **ADM-AC-01** Given khách hoặc người không phải quản trị, when xem danh sách tài khoản, then bị từ chối và không đọc gì.
- **ADM-AC-02** Given quản trị viên, when xem danh sách, then thấy mới nhất trước, 20 mỗi trang; số trang thành vị trí bắt đầu, từ khóa được cắt khoảng trắng, trang sai là trang đầu, danh sách rỗng vẫn có 1 trang.
- **ADM-AC-03** Given vai trò hoặc cách sắp xếp rỗng, then coi như không lọc; giá trị lạ hoặc từ khóa quá dài bị từ chối trước khi đọc.
- **ADM-AC-04** Given mã tài khoản, when xem một tài khoản, then quản trị viên nhận được tài khoản; mã sai dạng hoặc không tồn tại là không tìm thấy (mã sai dạng không chạm kho dữ liệu); khách và người thường bị từ chối.
- **ADM-AC-05** Given vai trò, credit, điểm, when lưu, then chỉ các trường được gửi mới đổi; số âm, lẻ, quá lớn, không phải số hoặc vai trò lạ bị từ chối bằng mã; khách và người thường bị từ chối và không ghi gì.
- **ADM-AC-06** Given quản trị viên đang xem chính mình, when đổi vai trò, then bị từ chối bằng mã `cannot_change_own_role`; vẫn đổi được credit và điểm của mình; đổi vai trò quản trị viên khác thì được.
- **ADM-AC-07** Given tài khoản không tồn tại, mã sai dạng hoặc biến mất giữa lúc đọc và ghi, when lưu, then báo không tìm thấy và không ghi gì.
- **ADM-AC-08** Given quản trị viên, when xem tổng quan, then nhận các con số (tài khoản, quản trị viên, mới 7 ngày, người có hạng, tổng điểm, đề đã xuất bản và nháp, lượt chấm, câu hoàn thành); người không phải quản trị bị từ chối mà không đọc.
- **ADM-AC-09** Given bộ lọc, when đọc danh sách, then gọi hàm cơ sở dữ liệu với đúng bộ lọc và chuyển dòng thành tài khoản; từ khóa rỗng gửi là null, trang rỗng có tổng 0, ảnh không an toàn bị bỏ.
- **ADM-AC-10** Given kho dữ liệu, then tìm một tài khoản (hoặc null), cập nhật chỉ các cột được gửi rồi đọc lại (không khớp tài khoản nào là null, patch rỗng không ghi), đọc tổng quan thành số, và lỗi cơ sở dữ liệu hoặc thiếu khóa service là lỗi hạ tầng không lộ thông điệp gốc.
- **ADM-AC-11** `manual` Menu trái đen có Tổng quan, Prompts, Tài khoản, Bảng xếp hạng và "Về dashboard"; mục đang mở được tô đầy. Dưới 1024px menu thu vào nút ba gạch, mở ra cùng các liên kết, đóng bằng Esc hoặc khi chọn. *Kiểm tra:* thu nhỏ cửa sổ về 390px.
- **ADM-AC-12** `manual` Trang Tổng quan có sáu ô số, danh sách top 5 người học và 5 tài khoản mới nhất (bấm vào mở trang quản lý), và các nút tắt. *Kiểm tra:* mở `/admin`.
- **ADM-AC-13** `manual` Trang Tài khoản có ô tìm, lọc vai trò, sắp xếp, bảng (ảnh, tên, email, vai trò, điểm, credit, ngày tham gia, đăng nhập gần nhất), phân trang; ở điện thoại mỗi tài khoản là một thẻ, không cuộn ngang. *Kiểm tra:* thử tìm, lọc, sang trang, ở 390px.
- **ADM-AC-14** `manual` Trang quản lý một tài khoản có thẻ tóm tắt và biểu mẫu vai trò, credit, điểm; lưu xong báo "Đã lưu"; nhập sai báo lỗi dưới ô; chính mình thì ô vai trò bị khóa kèm giải thích. *Kiểm tra:* sửa một người khác, rồi mở chính mình.
- **ADM-AC-15** `manual` Trang Bảng xếp hạng liệt kê toàn bộ tài khoản theo điểm, có hạng (1–3 tô đen, chưa có điểm hiện "—"), tìm kiếm và phân trang, bấm "Sửa" mở trang quản lý. *Kiểm tra:* mở `/admin/leaderboard` và sang trang 2.
- **ADM-AC-16** `manual` Given migration `0017_admin_console.sql`, when gọi các hàm `admin_*` bằng khóa anon hoặc phiên người dùng, then bị từ chối. *Kiểm tra:* gọi RPC từ trình duyệt.
