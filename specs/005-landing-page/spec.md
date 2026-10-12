# 005 — Trang chủ giới thiệu & giao diện đăng nhập Google

- **Status:** In progress
- **Tiền tố AC:** LND

## 1. Bối cảnh & mục tiêu
Người học tiếng Việt muốn luyện viết tiếng Anh cần hiểu ngay website này giúp gì cho họ và bắt đầu chỉ bằng một lần bấm. Trang chủ giải thích cách hoạt động; trang đăng nhập đưa họ vào bằng tài khoản Google.

## 2. Phạm vi
- **Trong:** trang chủ (giới thiệu, cách hoạt động, tính năng, kêu gọi hành động, chân trang), giao diện đăng nhập tập trung vào Google, trạng thái đăng nhập hiển thị trên đầu trang.
- **Ngoài:** nội dung bài học thật, bảng giá, blog, đa ngôn ngữ, chế độ tối.

## 3. Kịch bản người dùng
- Là khách mới, tôi đọc trang chủ trong vài giây và hiểu mình sẽ nhận được gì, rồi bấm bắt đầu với Google.
- Là người đã đăng nhập, tôi thấy nút vào thẳng khu vực của mình thay vì nút đăng nhập.
- Là người dùng điện thoại, tôi đọc và thao tác thoải mái, không phải cuộn ngang.

## 4. Yêu cầu chức năng
- **FR-1** Trang chủ nêu giá trị chính ngay màn hình đầu và cho thấy một ví dụ bài viết được chữa.
- **FR-2** Nút đầu trang đổi theo trạng thái đăng nhập; trang vẫn dùng được khi không đọc được phiên.
- **FR-3** Hành động chính (bắt đầu với Google) lặp lại ở đầu và cuối trang.
- **FR-4** Trang đăng nhập đặt Google làm lựa chọn chính, email và mật khẩu là lựa chọn phụ.
- **FR-5** Giao diện dùng được bằng bàn phím và không ép chuyển động với người tắt hiệu ứng.

## 5. Tiêu chí chấp nhận
- **LND-AC-01** Given người dùng đã đăng nhập, when quyết định phần tài khoản ở đầu trang, then là trạng thái đã đăng nhập kèm hồ sơ hiển thị (xem spec 006) và lối vào `/dashboard` với nhãn "Vào dashboard".
- **LND-AC-02** Given chưa đăng nhập, when quyết định phần tài khoản ở đầu trang, then là trạng thái khách với nút "Đăng nhập" dẫn tới `/login`.
- **LND-AC-03** Given việc đọc phiên gặp lỗi thường, when quyết định phần tài khoản ở đầu trang, then dùng trạng thái khách với nút "Đăng nhập" thay vì làm hỏng trang; lỗi điều khiển luồng của nền tảng (chuyển hướng, dữ liệu động) vẫn được ném lại.
- **LND-AC-04** `manual` Trang chủ có đủ: đầu trang, giới thiệu kèm ví dụ bài được chữa, ba bước, tính năng, kêu gọi hành động, chân trang; liên kết neo trên menu cuộn đúng tới phần tương ứng. *Kiểm tra:* mở `/` và bấm từng mục menu.
- **LND-AC-05** `manual` Ở chiều rộng 360px, 768px, 1280px: không có thanh cuộn ngang, chữ không bị cắt, vùng bấm đủ lớn. *Kiểm tra:* thu nhỏ cửa sổ hoặc dùng chế độ thiết bị của trình duyệt.
- **LND-AC-06** `manual` Dùng phím Tab: có liên kết "Bỏ qua điều hướng" ở đầu, mọi phần tử bấm được đều có viền focus rõ; bật "giảm chuyển động" của hệ điều hành thì ví dụ chữa bài hiện sẵn trạng thái cuối, không chạy hiệu ứng.
- **LND-AC-07** `manual` Nút "Bắt đầu với Google" ở đầu và cuối trang đều dẫn tới `/login`.
- **LND-AC-08** `manual` Trang `/login`: nút "Tiếp tục với Google" nổi bật nhất; form email thu gọn và tự mở khi có lỗi hoặc thông báo từ form email; thông báo lỗi từ Google hiện phía trên nút; các nút bị khóa khi đang xử lý. *Kiểm tra:* mở `/login?error=oauth_failed`, rồi nhập sai mật khẩu trong form email.

## 6. Ràng buộc phi chức năng & bảo mật
- Nội dung chỉ mô tả những gì sản phẩm hướng tới; không đưa số liệu, đánh giá hay bảng giá chưa có thật.
- Phông chữ phục vụ từ chính ứng dụng, không tải từ bên thứ ba.
- Tương phản chữ/nền đạt mức dễ đọc (tối thiểu 4.5:1 với chữ thường).

## 7. Câu hỏi mở
- Chưa có. Nội dung chữ trên trang là bản nháp để chủ dự án chỉnh lại.
