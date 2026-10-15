# 017 — Bảng xếp hạng

- **Status:** In progress
- **Tiền tố AC:** LDB

## 1. Bối cảnh & mục tiêu
Mỗi câu đúng cho 10 điểm (spec 013). Bảng xếp hạng cho người học thấy mình đứng đâu so với người khác và có thêm động lực luyện tập.

## 2. Phạm vi
- **Trong phạm vi:** trang "Bảng xếp hạng" cho người đã đăng nhập: top 10 theo điểm, ba người đầu (hạng 1 đến 3) hiện trên bục nhận giải, vị trí của chính mình; lối vào từ menu hồ sơ và từ huy hiệu điểm trên thanh điều hướng.
- **Ngoài phạm vi:** xếp hạng theo tuần/tháng; lọc theo bạn bè; xem hồ sơ người khác; ẩn danh theo lựa chọn người dùng.

## 3. Kịch bản người dùng
- Là người học, tôi bấm huy hiệu điểm hoặc mục "Bảng xếp hạng" trong menu hồ sơ để xem top 10.
- Là người học, tôi thấy ba người đứng đầu trên bục, bảy người tiếp theo ở danh sách.
- Là người học, nếu tôi ngoài top 10 tôi vẫn thấy hạng và điểm của mình.

## 4. Yêu cầu chức năng
- **FR-1** Xếp theo điểm giảm dần, hạng liên tục 1, 2, 3… không có hai người chung hạng. Điểm bằng nhau thì người có tài khoản cũ hơn đứng trước (rồi theo id), nên thứ tự không đổi giữa các lần tải. Người 0 điểm không có trong bảng.
- **FR-2** Mỗi dòng chỉ lộ tên hiển thị, ảnh đại diện (https) và điểm; không lộ email hay id. Người chưa đặt tên hiện là "Người dùng".
- **FR-3** Hồ sơ chỉ cho người dùng đọc dòng của mình, nên bảng được đọc bằng hai hàm cơ sở dữ liệu `leaderboard_top` và `leaderboard_rank` chỉ service role gọi được.
- **FR-4** Chỉ người đã đăng nhập xem được trang.
- **FR-5** Dùng được ở 390px, đủ Tiếng Việt và English, sáng và tối.

## 5. Tiêu chí chấp nhận
- **LDB-AC-01** Given người đã đăng nhập, when lấy bảng, then lấy đúng 10 người đầu, theo thứ tự kho trả về, và đánh dấu dòng của chính mình; kết quả không chứa id người dùng.
- **LDB-AC-02** Given mình nằm trong top, when lấy bảng, then vị trí của mình lấy từ top và không gọi thêm kho.
- **LDB-AC-03** Given mình ngoài top, when lấy bảng, then vị trí của mình (hạng, điểm) lấy riêng từ kho; chưa có điểm thì là null.
- **LDB-AC-04** Given khách, when lấy bảng, then báo chưa đăng nhập và không đọc kho.
- **LDB-AC-05** Given kho trên cơ sở dữ liệu, when đọc top, then gọi hàm `leaderboard_top` với giới hạn, đổi tên cột, bỏ khoảng trắng ở tên (rỗng là null), chỉ nhận ảnh https; lỗi hoặc thiếu khóa service role báo lỗi hạ tầng.
- **LDB-AC-06** Given kho trên cơ sở dữ liệu, when đọc vị trí của một người, then gọi `leaderboard_rank`; không có dòng là null; lỗi báo lỗi hạ tầng.
- **LDB-AC-07** `manual` Trang `/dashboard/leaderboard` có ba người đầu trên bục (hạng 1 ở giữa, cao nhất), bảy người sau trong danh sách, dòng của mình được tô nổi; chưa ai có điểm thì hiện lời mời bắt đầu luyện.
- **LDB-AC-08** `manual` Menu hồ sơ có mục "Bảng xếp hạng"; bấm huy hiệu điểm trên thanh điều hướng cũng mở trang này.
- **LDB-AC-09** `manual` Hai hàm SQL: người học gọi bằng phiên của mình bị từ chối; service role gọi được và không trả email.
- **LDB-AC-11** `manual` Hai người cùng điểm vẫn có hạng khác nhau và liên tục (…8, 9, 10), hạng của `leaderboard_rank` khớp với hạng trong `leaderboard_top`; bảng luôn đủ 10 dòng khi có ít nhất 10 người có điểm.
- **LDB-AC-10** `manual` Dùng được ở 390px không cuộn ngang, sáng và tối, đủ chữ Tiếng Việt và English.

## 6. Ràng buộc phi chức năng & bảo mật
- Cần `SUPABASE_SERVICE_ROLE_KEY` ở máy chủ và chạy migration `0012_leaderboard.sql` và `0013_leaderboard_sequential_rank.sql`.
- Tên và ảnh hiển thị cho mọi người học đã đăng nhập; đây là dữ liệu duy nhất lộ ra.
