# 008 — Đăng ký và đăng nhập bằng email + mật khẩu

- **Status:** In progress
- **Tiền tố AC:** EML

## 1. Bối cảnh & mục tiêu
Người dùng không có hoặc không muốn dùng Google vẫn cần tạo tài khoản và đăng nhập bằng email + mật khẩu, với giao diện rõ ràng, thông báo lỗi dễ hiểu theo ngôn ngữ đang dùng, và không để lộ email nào đã được đăng ký.

## 2. Phạm vi
- **Trong:** form đăng ký (họ tên, email, mật khẩu, nhập lại mật khẩu); form đăng nhập; quy tắc kiểm tra dữ liệu; lỗi theo từng trường bằng mã ổn định để dịch; màn hình "kiểm tra email" và gửi lại email xác nhận; ghi họ tên vào hồ sơ.
- **Ngoài:** quên/đặt lại mật khẩu, đổi mật khẩu, đổi email, xác thực hai lớp, chặn bot (CAPTCHA).
- Hành vi xác nhận email, đăng xuất, bảo vệ route, callback dùng lại từ `001-auth` và `004-google-login`.

## 3. Kịch bản người dùng
- Tôi mở trang đăng nhập, chuyển sang tab "Tạo tài khoản", nhập họ tên, email, mật khẩu hai lần, rồi nhận hướng dẫn kiểm tra email (hoặc vào thẳng dashboard nếu dự án tắt xác nhận email).
- Tôi đăng nhập bằng email và mật khẩu, nếu sai thì thấy lý do rõ ràng ngay tại form.
- Tôi chưa xác nhận email thì được báo và có thể gửi lại email.
- Tôi dùng tiếng Anh thì mọi thông báo là tiếng Anh.

## 4. Yêu cầu chức năng
- **FR-1** Họ tên: bắt buộc, tối đa 80 ký tự sau khi cắt khoảng trắng hai đầu.
- **FR-2** Email: hợp lệ; được cắt khoảng trắng và chuyển chữ thường trước khi gửi đi.
- **FR-3** Mật khẩu khi đăng ký: 8–72 ký tự, có ít nhất một chữ cái và một chữ số. Khi đăng nhập chỉ yêu cầu không để trống (tài khoản cũ có thể có mật khẩu ngắn hơn).
- **FR-4** Lỗi dùng mã ổn định để giao diện dịch; không hiển thị nguyên văn lỗi của dịch vụ.
- **FR-5** Không tiết lộ email đã tồn tại khi dự án bật xác nhận email.
- **FR-6** Họ tên đăng ký được lưu vào hồ sơ (`profiles.full_name`).

## 5. Tiêu chí chấp nhận
- **EML-AC-01** Given họ tên, email và mật khẩu hợp lệ, when đăng ký, then dịch vụ nhận họ tên và email đã chuẩn hóa (cắt khoảng trắng, email chữ thường), mật khẩu nguyên văn và địa chỉ quay lại.
- **EML-AC-02** Given họ tên trống, chỉ có khoảng trắng hoặc dài hơn 80 ký tự, when đăng ký, then báo lỗi dữ liệu với mã `name_required` hoặc `name_too_long` và không gọi dịch vụ.
- **EML-AC-03** Given mật khẩu ngắn hơn 8, dài hơn 72, hoặc thiếu chữ cái hay chữ số, when đăng ký, then báo lỗi dữ liệu với mã `password_too_short`, `password_too_long` hoặc `password_weak` và không gọi dịch vụ.
- **EML-AC-04** Given email sai định dạng hoặc thiếu, when đăng ký, đăng nhập hoặc gửi lại email xác nhận, then báo lỗi dữ liệu với mã `email_invalid`.
- **EML-AC-05** Given mật khẩu cũ ngắn nhưng không rỗng, when đăng nhập, then vẫn được chuyển cho dịch vụ; mật khẩu rỗng thì báo mã `password_required`.
- **EML-AC-06** Given lỗi từ dịch vụ xác thực, when chuyển thành lỗi ứng dụng, then: thông tin sai → `invalid_credentials`; email chưa xác nhận → `email_not_confirmed`; email đã tồn tại → `email_taken`; mật khẩu bị chính sách dịch vụ từ chối → `weak_password`; quá nhiều yêu cầu → `rate_limited`; lỗi khác → lỗi hạ tầng, không lộ nội dung gốc.
- **EML-AC-07** Given dịch vụ trả về người dùng không có danh tính nào (email đã đăng ký và đã xác nhận), when đăng ký, then kết quả như đăng ký mới cần xác nhận email, để không lộ email đã tồn tại.
- **EML-AC-08** Given email hợp lệ, when gửi lại email xác nhận, then dịch vụ nhận email đã chuẩn hóa cùng địa chỉ quay lại; thành công không phụ thuộc email có tồn tại hay không.
- **EML-AC-09** Given một lỗi từ use case, when chuyển thành trạng thái form, then lỗi của từng trường nằm trong `fieldErrors` (theo vị trí lỗi), lỗi chung nằm ở `formError`; lỗi không lường trước được ghi log và trả `unknown`, còn lỗi điều hướng của Next được ném lại.
- **EML-AC-10** Given mật khẩu và nhập lại mật khẩu khác nhau, when đọc form đăng ký, then báo `password_mismatch` ở trường nhập lại và không gọi use case.
- **EML-AC-11** `manual` Trang đăng nhập có hai tab "Đăng nhập" và "Tạo tài khoản" (mở thẳng tab đăng ký bằng `?mode=signup`), nút hiện/ẩn mật khẩu, thuộc tính `autocomplete` đúng (`email`, `current-password`, `new-password`, `name`), dùng được bằng bàn phím. *Kiểm tra:* thao tác trên máy tính và ở 390px.
- **EML-AC-12** `manual` Lỗi hiện ngay dưới trường tương ứng (có `aria-invalid`, `aria-describedby`), lỗi chung hiện ở đầu form, giữ lại họ tên và email đã nhập sau khi lỗi. *Kiểm tra:* gửi form trống, sai định dạng, mật khẩu yếu, hai mật khẩu khác nhau.
- **EML-AC-13** `manual` Đăng ký xong mà cần xác nhận email thì thấy màn hình "Kiểm tra email" có địa chỉ vừa nhập và nút "Gửi lại email"; nhấp liên kết trong email thì vào `/dashboard`. Nếu đăng nhập khi chưa xác nhận thì thấy lỗi `email_not_confirmed` kèm nút gửi lại. *Kiểm tra:* đăng ký bằng một email thật.
- **EML-AC-14** `manual` Đăng nhập thành công vào `/dashboard` (hoặc `/en/dashboard` khi đang dùng tiếng Anh); hồ sơ hiện đúng họ tên đã nhập khi đăng ký. *Kiểm tra:* đăng ký, xác nhận, đăng nhập và xem tên ở thanh điều hướng.
- **EML-AC-15** `manual` Mọi thông báo lỗi và nhãn của form có bản tiếng Việt và tiếng Anh theo ngôn ngữ đang dùng. *Kiểm tra:* thử cả `/login` và `/en/login`.
- **EML-AC-16** `manual` Cấu hình Supabase: bật Email provider; quyết định bật/tắt "Confirm email"; địa chỉ `/auth/callback` nằm trong Redirect URLs. *Kiểm tra:* theo `docs/email-auth-setup.md`.

## 6. Ràng buộc phi chức năng & bảo mật
- Không ghi mật khẩu vào log, không đưa mật khẩu vào URL hay trạng thái trả về từ Server Action.
- Thông báo đăng nhập sai không cho biết email có tồn tại hay không.
- Giới hạn tần suất do Supabase xử lý; app chỉ hiển thị mã `rate_limited`.
- Mật khẩu tối đa 72 ký tự vì giới hạn của bcrypt.

## 7. Câu hỏi mở
- Quên mật khẩu / đặt lại mật khẩu: để spec riêng.
- Có cần CAPTCHA khi mở đăng ký công khai không.
