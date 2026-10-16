# 018 — Trang hồ sơ và ảnh đại diện

- **Status:** Implemented
- **Tiền tố AC:** PRP
- **Tác giả / ngày:** 2026-10-15

## 1. Bối cảnh & mục tiêu
Người học muốn thấy mình ở một chỗ: thông tin tài khoản, thứ hạng, các lần làm bài, và tự đổi tên, ảnh đại diện. Thành công là mở "Hồ sơ" từ menu ở thanh trên cùng và thấy đủ những thứ đó, đổi ảnh xong thấy ngay ở mọi nơi.

## 2. Phạm vi
- **Trong:** trang `/dashboard/profile`; mục "Hồ sơ" trong menu tài khoản; đổi tên hiển thị; tải lên, đổi, xóa ảnh đại diện (lưu ở Supabase Storage); thứ hạng của riêng mình; các lần làm bài gần đây.
- **Ngoài:** đổi email hoặc mật khẩu, xóa tài khoản, xem hồ sơ người khác, cắt ảnh bằng tay (ảnh luôn được cắt vuông ở giữa).
- Mở rộng `002-profile` (vốn chưa có sửa hồ sơ và tải ảnh). Danh sách lần làm bài dùng lại `015-attempt-history`, thứ hạng dùng lại `017-leaderboard`.

## 3. Kịch bản người dùng
- Tôi mở menu, chọn "Hồ sơ" và thấy tên, email, ngày tham gia, điểm, credit, thứ hạng và vài lần làm bài gần nhất.
- Tôi chọn ảnh từ máy, ảnh được thu nhỏ rồi tải lên, và ảnh mới hiện ở thanh trên và bảng xếp hạng.
- Tôi sửa tên hiển thị, tên mới hiện ở menu và bảng xếp hạng.

## 4. Yêu cầu chức năng
- **FR-1** Chỉ người đã đăng nhập đổi được hồ sơ, và chỉ hồ sơ của chính mình.
- **FR-2** Ảnh phải là JPG, PNG hoặc WebP thật (kiểm tra bằng nội dung tệp, không tin loại tệp trình duyệt khai), tối đa 512 KB. Trình duyệt thu ảnh về 256×256 trước khi gửi nên ảnh thật chỉ vài chục KB.
- **FR-3** Ảnh nằm trong bucket công khai `avatars`, mỗi người một thư mục `<id người dùng>/`, tên tệp ngẫu nhiên mỗi lần tải lên (không bị bộ nhớ đệm giữ ảnh cũ). Chỉ chủ thư mục được ghi hoặc xóa.
- **FR-4** Đổi hoặc xóa ảnh thì xóa tệp cũ của mình; ảnh từ nơi khác (ví dụ ảnh Google) không bị đụng tới.
- **FR-6** Tài khoản mới có sẵn ảnh đại diện mặc định (ảnh Google nếu đăng nhập bằng Google, còn lại là ảnh sinh tự động đen trắng, chỉ phụ thuộc id người dùng nên không gửi tên hay email ra ngoài); người dùng đổi sau. Tài khoản cũ chưa có ảnh được bổ sung ảnh mặc định.
- **FR-5** Tên hiển thị 1 đến 80 ký tự sau khi cắt khoảng trắng.

## 5. Tiêu chí chấp nhận
- **PRP-AC-01** Given nội dung tệp, when nhận diện loại ảnh, then nhận ra JPEG, PNG, WebP bằng các byte đầu; mọi thứ khác (SVG, GIF, tệp rỗng, RIFF không phải WebP) bị từ chối.
- **PRP-AC-02** Given tên mới, when đổi tên, then lưu tên đã cắt khoảng trắng cho đúng người đang đăng nhập; tên rỗng hoặc dài hơn 80 ký tự bị từ chối bằng mã `name_required` hoặc `name_too_long` và không lưu; chưa đăng nhập thì báo chưa đăng nhập.
- **PRP-AC-03** Given ảnh hợp lệ, when tải lên, then ảnh được lưu, hồ sơ trỏ tới địa chỉ mới và ảnh cũ bị xóa; chưa có ảnh cũ thì không xóa gì.
- **PRP-AC-04** Given tệp rỗng, lớn hơn 512 KB hoặc không phải ảnh, when tải lên, then bị từ chối bằng mã `avatar_empty`, `avatar_too_large` hoặc `avatar_type_invalid` trước khi lưu gì.
- **PRP-AC-05** Given người chưa đăng nhập, when tải lên hoặc xóa ảnh, then báo chưa đăng nhập và không lưu gì.
- **PRP-AC-06** Given hồ sơ không cập nhật được sau khi đã lưu tệp, when tải lên, then tệp mới bị xóa lại và lỗi gốc được giữ; given xóa ảnh cũ thất bại, then thay ảnh vẫn thành công.
- **PRP-AC-07** Given người đã tải ảnh lên, when chọn dùng ảnh mặc định, then hồ sơ trỏ lại ảnh mặc định và tệp đã tải bị xóa.
- **PRP-AC-08** Given người học, when xem thứ hạng của mình, then chỉ đọc hạng và điểm của riêng mình; chưa có điểm thì không có hạng; chưa đăng nhập thì báo chưa đăng nhập.
- **PRP-AC-09** Given kho hồ sơ, when cập nhật, then chỉ ghi các trường được đưa vào, trên đúng dòng của người dùng, trả hồ sơ đã ánh xạ; không có dòng thì báo không tìm thấy; lỗi cơ sở dữ liệu báo lỗi hạ tầng không lộ nội dung gốc.
- **PRP-AC-10** Given kho ảnh, when tải lên, then ghi vào thư mục của người dùng với tên ngẫu nhiên và đuôi đúng loại, trả địa chỉ công khai; lỗi báo lỗi hạ tầng không lộ nội dung gốc.
- **PRP-AC-11** Given địa chỉ ảnh, when xóa, then chỉ xóa tệp nằm trong thư mục của chính người đó ở bucket này; ảnh của người khác, đường dẫn thoát thư mục, thư mục lồng nhau, ảnh Google, bucket khác hoặc địa chỉ hỏng đều không bị đụng tới.
- **PRP-AC-16** Given mã người dùng, when tạo ảnh mặc định, then là địa chỉ https chỉ phụ thuộc mã đó (mã được mã hóa nên không thêm được tham số); chỉ ảnh sinh tự động mới được coi là mặc định, ảnh đã tải lên hay ảnh Google thì không.
- **PRP-AC-12** `manual` Menu tài khoản có mục "Hồ sơ" (đầu danh sách) dẫn tới `/dashboard/profile`. *Kiểm tra:* mở menu và bấm.
- **PRP-AC-13** `manual` Trang hồ sơ có: thẻ đen với ảnh, tên, email, ngày tham gia; ba ô số (điểm, credit, câu đã đúng); mục Xếp hạng (#hạng và điểm, bấm để mở bảng xếp hạng; chưa có điểm thì mời luyện tập); mục Thông tin tài khoản (sửa tên, email, ngày tham gia); mục Các lần làm gần đây (tối đa 5, "Xem tất cả" dẫn tới danh sách đầy đủ; chưa có thì mời luyện tập). Sáng và tối đều đọc được, ở 390px không cuộn ngang. *Kiểm tra:* mở bằng tài khoản có điểm và tài khoản mới.
- **PRP-AC-14** `manual` Chọn ảnh JPG, PNG hoặc WebP (kể cả ảnh chụp điện thoại vài MB) thì được cắt vuông, thu nhỏ, tải lên, hiện ngay và cập nhật ở thanh trên và bảng xếp hạng; "Dùng ảnh mặc định" (chỉ hiện khi đang dùng ảnh tự tải) trả về ảnh mặc định; tệp không phải ảnh hiện lỗi dễ hiểu. *Kiểm tra:* thử một ảnh lớn, một tệp `.txt` đổi đuôi thành `.png`, rồi chọn ảnh mặc định.
- **PRP-AC-17** `manual` Given migration `0016_default_avatar.sql`, when tạo tài khoản mới bằng email, then hồ sơ có sẵn `avatar_url` là ảnh mặc định và trang hồ sơ, thanh trên, bảng xếp hạng đều hiển thị; đăng nhập Google lần đầu thì giữ ảnh Google. *Kiểm tra:* đăng ký một email mới rồi xem `profiles.avatar_url`.
- **PRP-AC-15** `manual` Given migration `0015_avatars_storage.sql`, when dùng phiên người dùng khác, then không ghi được hoặc xóa được tệp trong thư mục của người khác. *Kiểm tra:* theo `docs/avatar-storage-setup.md`.

## 6. Ràng buộc phi chức năng & bảo mật
- Bucket công khai chỉ đọc: ảnh đại diện vốn hiện cho mọi người học trên bảng xếp hạng. Không đặt dữ liệu riêng tư vào bucket này.
- Giới hạn kích thước và loại tệp được áp ở ba nơi: trình duyệt (thu nhỏ), ứng dụng (kiểm tra byte) và bucket (cấu hình Storage).
- Địa chỉ ảnh hiển thị vẫn đi qua `safeAvatarUrl` (chỉ https).
- Quản trị viên được chuyển sang khu Admin nên không thấy trang này (xem `010-admin-prompts`).

## 7. Câu hỏi mở
- Không có.
