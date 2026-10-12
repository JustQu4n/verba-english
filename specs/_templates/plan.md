# NNN — Kế hoạch kỹ thuật

- **Spec:** ./spec.md
- **Kiểm tra hiến chương:** (nêu nguyên tắc nào áp dụng, có ngoại lệ không)

## 1. Thiết kế theo lớp
| Lớp | Thay đổi |
|---|---|
| domain | entity/value object mới |
| application | port, use case, schema zod |
| infrastructure | repository/adapter, migration |
| presentation | route/page/action |

## 2. Dữ liệu & migration
(bảng, cột, RLS, policy — hoặc "không đổi")

## 3. Hợp đồng API / UI
(endpoint, request/response, mã lỗi — hoặc màn hình)

## 4. Chiến lược test (AC → mức test)
| AC | Mức (unit use case / adapter / manual) | Ghi chú |
|---|---|---|

## 5. Rủi ro & phương án
