# Sửa lỗi lịch sử đề xuất dị ứng

API `GET /api/users/me/allergen-requests` đã trả HTTP 500 với chi tiết:

```text
Table 'VegetarianSupportSystemDB.AllergenSubmissions' doesn't exist
```

Đây là bảng lịch sử đề xuất mà BE hiện tại đã sử dụng. Script không ghép bảng,
không sửa `Allergens` / `UserAllergens`, không thêm hay xóa dữ liệu người dùng.

## Áp dụng bằng MySQL Workbench

1. Chọn đúng connection và database đang được API cấu hình sử dụng. Với lỗi trên,
   tên database là `VegetarianSupportSystemDB`.
2. Mở `repair-allergen-submissions.sql`, xem lại database đích rồi chạy script.
3. Script tạo bảng nếu thiếu bằng đúng định nghĩa trong
   `BE/DAL/Data/AllergenSubmissionSchemaUpdate.cs`, sau đó kiểm tra các cột API cần.
4. Đăng nhập FE, mở hồ sơ và tải lại lịch sử đề xuất dị ứng. API phải trả HTTP 200;
   khi chưa có đề xuất thì kết quả là `[]`.

Nếu bảng đã tồn tại, script không thay đổi cấu trúc bảng đó. Nếu bước kiểm tra
cột thất bại, dừng và đối chiếu schema trước khi chạy thêm thao tác khác.

## Công cụ cập nhật sẵn có của BE

Từ thư mục BE, có thể dùng công cụ hiện có thay cho việc chạy SQL thủ công:

```powershell
dotnet run --project Tests/RecipeCategories/RecipeCategories.csproj -- --apply-allergen-review-schema
```

Công cụ đọc kết nối từ `API/.env`, `API/.aiven.env`, rồi biến môi trường.
Kiểm tra đúng database đích trước khi chạy. Công cụ còn kiểm tra các ràng buộc
bằng dữ liệu thử trong transaction rồi rollback; không lưu các dòng thử đó.

## Khi deploy

Sao lưu database đích và chạy cập nhật schema như một bước bảo trì riêng trước
khi đưa tính năng lên. Nếu database local và deploy khác nhau, cần cập nhật từng
database tương ứng. Không đặt script vào luồng tải trang hoặc tự chạy mỗi khi
Render khởi động lại. Không tắt xác thực và không đổi lỗi 500 thành danh sách rỗng.

Sau deploy, kiểm tra API này bằng tài khoản đăng nhập có token hợp lệ. Việc
build FE/BE thành công không xác nhận database đích đã có đủ schema.
