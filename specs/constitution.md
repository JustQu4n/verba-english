# Hiến chương dự án (Constitution)

Các nguyên tắc dưới đây ràng buộc mọi thay đổi. Khi có xung đột, hiến chương thắng.

1. **Spec là nguồn sự thật.** Mọi hành vi quan sát được phải có trong `specs/NNN-ten/spec.md`. Muốn đổi hành vi → sửa spec **trước**, rồi mới sửa test và code.
2. **Spec nói "cái gì & vì sao", không nói "như thế nào".** Không nêu framework, thư viện, tên bảng hay tên hàm trong spec.
3. **Test trước (Red → Green → Refactor).** Không viết code production khi chưa có test thất bại vì đúng lý do. Sửa lỗi cũng bắt đầu bằng test tái hiện lỗi.
4. **Mỗi tiêu chí chấp nhận (AC) có mã duy nhất** dạng `PREFIX-AC-NN` và ít nhất một test có mã đó trong tên (`it("AUTH-AC-02: ...")`). AC không tự động hóa được phải đánh dấu `` `manual` `` kèm cách kiểm tra.
5. **Clean Architecture** theo `CLAUDE.md` và `.claude/rules/architecture.md`; ESLint không được tắt để "cho qua".
6. **Use case/domain kiểm thử bằng fake port**, không phụ thuộc Supabase hay Next. Adapter hạ tầng có test hợp đồng riêng với client giả.
7. **Bước nhỏ, luôn xanh.** Mỗi task trong `tasks.md` kết thúc ở trạng thái `npm run check` pass.
8. **Cổng chất lượng** (`npm run check`): typecheck, lint, test + coverage, truy vết spec. Build phải pass trước khi báo hoàn thành.
9. **Câu hỏi chưa rõ** ghi `[NEEDS CLARIFICATION: ...]` trong spec và hỏi người dùng; không tự đoán rồi cài đặt.

## Quy trình

```
/spec  →  (người duyệt)  →  /plan  →  (người duyệt)  →  /tasks  →  /implement (TDD)  →  /verify
```

Trạng thái spec: `Draft` (đang viết, chưa kiểm truy vết) → `In progress` (đang làm, AC phải có test) → `Implemented`.
