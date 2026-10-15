# 016 — Giao diện sáng / tối

- **Status:** In progress
- **Tiền tố AC:** THM

## 1. Bối cảnh & mục tiêu
Người học muốn dùng Verba ban đêm mà không chói mắt. Giao diện có hai chế độ, **sáng** và **tối**, đổi bằng một nút ở thanh đầu trang. Lần đầu theo cài đặt của hệ điều hành; sau khi người dùng chọn thì nhớ lựa chọn đó trên trình duyệt.

## 2. Phạm vi
- **Trong phạm vi:** trang chủ, đăng nhập, khu luyện tập (dashboard) và khu Admin; nút đổi chế độ ở các thanh đầu trang; nhớ lựa chọn; không nháy sáng khi tải trang.
- **Ngoài phạm vi:** lưu lựa chọn trên tài khoản (chỉ lưu trên trình duyệt); thêm chế độ thứ ba "theo hệ thống" thành nút riêng (mặc định lần đầu đã theo hệ thống).

## 3. Kịch bản người dùng
- Là người học dùng máy ở chế độ tối, tôi mở Verba và thấy giao diện tối ngay, không nháy trắng.
- Là người học, tôi bấm nút mặt trăng/mặt trời để đổi, và lần sau vào lại vẫn giữ nguyên.

## 4. Yêu cầu chức năng
- **FR-1** Chưa có lựa chọn đã lưu thì theo `prefers-color-scheme` của hệ điều hành; đã lưu "light" hoặc "dark" thì dùng giá trị đó. Giá trị lưu không hợp lệ bị bỏ qua.
- **FR-2** Chế độ được áp bằng thuộc tính `data-theme` ("light"/"dark") trên thẻ `<html>`, đặt bởi đoạn mã chạy trước khi vẽ trang nên không nháy sáng. Không dùng lớp CSS vì React ghi đè lớp của `<html>` mỗi khi bố cục gốc vẽ lại (đổi ngôn ngữ, chuyển trang), làm mất chế độ.
- **FR-3** Nút đổi chế độ chuyển qua lại sáng/tối, lưu lựa chọn vào `localStorage` (lỗi khi lưu không làm hỏng nút), có tên cho trình đọc màn hình và hiện biểu tượng đúng với chế độ sẽ chuyển sang.
- **FR-4** Cả hai chế độ giữ phong cách đen trắng của logo: tối là nền gần đen, chữ gần trắng; chữ luôn đủ tương phản.
- **FR-5** Các khối đảo màu (dải số liệu, thẻ ví dụ, kêu gọi hành động, chân trang trên trang chủ) vẫn là khối tối ở chế độ tối, không biến thành khối trắng.

## 5. Tiêu chí chấp nhận
- **THM-AC-01** Given giá trị đã lưu và cài đặt hệ điều hành, when quyết định chế độ, then "dark"/"light" đã lưu thắng; không có hoặc không hợp lệ thì theo hệ điều hành.
- **THM-AC-02** Given đoạn mã khởi tạo, when chạy với từng tổ hợp (đã lưu, hệ điều hành), then đặt `data-theme` trên `<html>` đúng quy tắc, và không ném lỗi khi `localStorage` bị chặn.
- **THM-AC-03** Given chế độ hiện tại, when chọn chế độ kế tiếp, then đảo giữa sáng và tối.
- **THM-AC-04** `manual` Nút ở trang chủ, đăng nhập, dashboard và Admin đổi được chế độ; tải lại trang vẫn giữ; đổi cài đặt hệ điều hành khi chưa chọn thì giao diện theo; không nháy sáng khi tải trang. *Kiểm tra:* bấm nút, tải lại, đổi cài đặt hệ thống, thử với cookie/bộ nhớ bị xóa.
- **THM-AC-05** `manual` Ở chế độ tối, mọi màn hình đọc rõ: không có chữ đen trên nền tối hay chữ trắng trên nền sáng; khối đảo màu trên trang chủ vẫn tối; thẻ, viền, ô nhập, hộp thoại, bảng Admin, pháo hoa nhìn thấy được; dùng được ở 390px. *Kiểm tra:* duyệt từng màn ở chế độ tối.
- **THM-AC-06** `manual` Chế độ vẫn giữ nguyên sau khi đổi ngôn ngữ và sau khi chuyển trang (kể cả nút Quay lại). *Kiểm tra:* chọn chế độ tối, đổi ngôn ngữ, mở trang đăng nhập, bấm Quay lại.

## 6. Ràng buộc phi chức năng & bảo mật
- Chỉ lưu một giá trị "light"/"dark" trên trình duyệt, không có dữ liệu cá nhân.
- Tôn trọng tùy chọn giảm chuyển động (không thêm hiệu ứng chuyển màu dài).

## 7. Câu hỏi mở
- [NEEDS CLARIFICATION: Có cần lưu lựa chọn theo tài khoản để đồng bộ giữa các thiết bị không? Hiện chỉ lưu trên trình duyệt.]
