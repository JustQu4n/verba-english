# 022 — Màu nhấn tùy chỉnh (khối đậm)

- **Status:** Implemented
- **Tiền tố AC:** BGC
- **Tác giả / ngày:** 2026-10-19

## 1. Bối cảnh & mục tiêu
Verba đang đen–trắng. Người học muốn mang màu của mình vào giao diện nhưng vẫn giữ nền trang và chữ như cũ. Mỗi người chọn một màu (đậm, vừa hoặc nhạt) thay cho màu đen của các khối đậm (dải số liệu, thẻ nổi bật, nút, huy hiệu, thanh tiến độ). Màu lưu trên tài khoản, áp cho toàn site và đi theo người học sang thiết bị khác.

## 2. Phạm vi
- **Trong phạm vi:** bộ màu có sẵn (nhóm đậm, vừa và nhạt) ở trang hồ sơ; lưu trên tài khoản; áp cho trang chủ, đăng nhập, khu luyện tập và Admin; đồng bộ sang thiết bị khác; quên màu khi đăng xuất.
- **Ngoài phạm vi:** chọn màu tự do (bảng màu bất kỳ); đổi màu nền trang, màu chữ, phông chữ; nhiều bộ giao diện đặt tên; màu cho khách chưa đăng nhập.

## 3. Kịch bản người dùng
- Là người học, tôi chọn "Xanh navy" ở trang hồ sơ và các khối đen (dải số liệu, thẻ "Luyện câu", nút chính) đổi sang navy ngay, nền trang vẫn trắng.
- Là người học dùng hai máy, tôi đăng nhập máy thứ hai và thấy đúng màu đã chọn.
- Là người học, tôi chọn "Đen (mặc định)" để quay lại như ban đầu.

## 4. Yêu cầu chức năng
- **FR-1** Màu nhấn là một trong các màu có sẵn (nhóm đậm, rồi vừa, rồi nhạt) (`#rrggbb`, chữ thường) hoặc rỗng. Rỗng nghĩa là màu đen mặc định. Màu ngoài bộ có sẵn bị từ chối.
- **FR-2** Chữ trên mọi màu có sẵn phải đọc rõ: chữ trắng với tương phản từ 7:1 trên nhóm đậm và từ 5:1 trên nhóm vừa; chữ gần đen với tương phản từ 7:1 trên nhóm nhạt.
- **FR-3** Màu nhấn thay màu đen của: khối đảo màu (`inverse`), nút chính, và các phần tô đặc nhỏ (huy hiệu, chip đang chọn, thanh tiến độ). Nền trang, chữ thường và viền không đổi; chữ trên khối là trắng, riêng màu nhạt thì chữ trên khối chuyển sang gần đen. Màu áp ở cả giao diện sáng lẫn tối: ở giao diện tối, nút chính, thẻ đang chọn, huy hiệu và thanh tiến độ (vốn là khối trắng) cũng lấy màu đã chọn.
- **FR-4** Màu được áp bởi đoạn mã chạy trước khi vẽ trang (đọc từ trình duyệt) nên không nháy màu đen; bản gốc nằm trên tài khoản và được đồng bộ vào trình duyệt mỗi lần vào khu luyện tập. Nút sáng/tối không bị ảnh hưởng.
- **FR-5** Ở trang hồ sơ: bấm một màu thì áp và lưu ngay; lưu lỗi thì quay về màu cũ và báo lỗi.
- **FR-6** Đăng xuất xóa màu khỏi trình duyệt, để người dùng tiếp theo không thừa hưởng.
- **FR-7** Chỉ chủ tài khoản đọc và đổi được màu của mình; cột mới chỉ được cập nhật bởi chính người đó.

## 5. Tiêu chí chấp nhận
- **BGC-AC-01** Given một giá trị, when kiểm tra màu nhấn, then chỉ màu thuộc bộ có sẵn (hoa thường đều được, bỏ khoảng trắng hai đầu) hợp lệ và được trả về dạng chữ thường; mọi giá trị khác (rỗng, tên màu, màu ngoài bộ, không phải chuỗi) là không hợp lệ.
- **BGC-AC-02** Given bộ màu có sẵn, then chữ trên mỗi màu đạt tương phản từ 7:1 (chữ trắng trên nhóm đậm, chữ gần đen trên nhóm nhạt) hoặc 5:1 (chữ trắng trên nhóm vừa); có đủ ba nhóm theo thứ tự đậm, vừa, nhạt; và quy tắc chọn màu chữ khớp với nhóm của từng màu.
- **BGC-AC-03** Given bộ màu có sẵn, then mã định danh và màu không trùng nhau, mỗi màu là `#rrggbb` chữ thường.
- **BGC-AC-04** Given người đã đăng nhập, when lưu màu nhấn, then chỉ lưu cho chính họ ở dạng chữ thường; `null` xóa màu; giá trị không hợp lệ bị từ chối bằng mã `invalid_color` và không lưu gì; khách bị từ chối là chưa đăng nhập.
- **BGC-AC-05** Given một màu nhấn, when áp lên giao diện, then đặt `data-accent` và biến màu, màu nhạt còn đặt `data-accent-tone="light"` để chữ trên khối thành gần đen; `null` gỡ tất cả; thuộc tính `data-theme` không bị đụng tới.
- **BGC-AC-06** Given đoạn mã khởi tạo trong `<head>`, when có màu nhấn hợp lệ trong trình duyệt, then đặt biến màu, `data-accent` và (với màu nhạt) `data-accent-tone`, khớp quy tắc ở phía máy chủ, mà không đổi sáng/tối; giá trị không hợp lệ (kể cả chuỗi chèn thêm CSS) hoặc `localStorage` bị chặn thì bỏ qua và giữ giao diện thường.
- **BGC-AC-07** `manual` Ở trang hồ sơ, ở cả giao diện sáng lẫn tối, chọn từng màu (cả nhóm nhạt: chữ trên khối chuyển gần đen, vẫn rõ) thì dải số liệu trang chủ, thẻ khối đậm ở dashboard, nút chính, huy hiệu và thanh tiến độ đổi ngay sang màu đó, nền trang và chữ không đổi, chữ trên khối vẫn rõ; tải lại trang và mở trên trình duyệt khác vẫn đúng màu. *Kiểm tra:* chọn "Xanh navy", tải lại, đăng nhập trình duyệt khác.
- **BGC-AC-08** `manual` Chọn "Đen (mặc định)" thì mọi khối về màu đen (ở giao diện tối thì về trắng như cũ); đổi ngôn ngữ và đổi sáng/tối đều giữ màu đã chọn. *Kiểm tra:* chọn màu, đổi ngôn ngữ, bấm nút sáng/tối, rồi chọn lại màu đen.
- **BGC-AC-09** `manual` Sau khi đăng xuất, trang chủ trở lại màu đen mặc định. *Kiểm tra:* chọn màu, đăng xuất, nhìn trang chủ.
- **BGC-AC-10** `manual` Given migration `0020_profile_accent.sql`, then người đăng nhập cập nhật được cột `accent_color` của chính mình, giá trị sai định dạng bị cơ sở dữ liệu từ chối, và không sửa được của người khác. *Kiểm tra:* chạy migration, thử cập nhật `'red'` và hàng của người khác.

## 6. Ràng buộc phi chức năng & bảo mật
- Chỉ lưu một chuỗi màu; không có dữ liệu cá nhân. Giá trị được kiểm tra ở ba chỗ: use case (chỉ màu có sẵn), ràng buộc cơ sở dữ liệu (`#rrggbb`) và đoạn mã khởi tạo (`#rrggbb`), nên không chèn được CSS tùy ý.
- Không tải thêm tài nguyên nào; không thêm hiệu ứng chuyển màu.

## 7. Câu hỏi mở
- Chưa có.
