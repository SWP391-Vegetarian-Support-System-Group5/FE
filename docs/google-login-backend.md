# API BE cần bổ sung để lưu người dùng đăng nhập Google

FE đã nối hợp đồng bên dưới. BE local được kiểm tra hiện chưa có endpoint này.
Firebase Authentication xác thực Google; việc ghi Users/UserProfiles và cấp JWT ứng dụng phải do BE thực hiện.

## Request

`POST /api/auth/google`, cho phép chưa đăng nhập, Content-Type: application/json.

```json
{ "idToken": "Firebase ID token lấy từ result.user.getIdToken()" }
```

Không nhận Google access token hoặc tin cậy email/userId/role do FE tự gửi.

## Xử lý BE

1. Xác minh Firebase ID token bằng Firebase Admin SDK với project `vegetarian-support-system`. Kiểm tra chữ ký, hạn dùng, issuer/audience, provider Google và email đã xác minh. Cấu hình service account chỉ ở BE.
2. Tra danh tính theo Firebase UID/provider đã lưu. Lần đầu tạo Users và UserProfiles trong transaction, email/tên/ảnh lấy từ token đã xác minh. Role mặc định USER; không cấp quyền từ dữ liệu FE.
3. Có ràng buộc duy nhất cho danh tính ngoài và email để tránh trùng khi đăng nhập đồng thời. Nếu email đã có tài khoản khác nhưng chưa liên kết, trả 409 và yêu cầu liên kết tài khoản sau khi xác thực tài khoản cũ; không tự nối chỉ vì trùng email.
4. Người dùng đã có thì dùng lại userId và quyền hiện tại, không ghi đè hồ sơ người dùng tùy ý. Tài khoản bị khóa trả 403.
5. Chỉ sau khi lưu DB thành công mới trả AuthResponse giống API login hiện tại: JWT do BE cấp và UserResponse với userId trong DB. Tài khoản Google không sử dụng mật khẩu giả hoặc mật khẩu dùng chung; cập nhật schema nếu cần.

## Response HTTP 200

```json
{
  "token": "JWT ứng dụng do BE cấp",
  "user": {
    "userId": 123,
    "email": "user@example.com",
    "fullName": "Tên người dùng",
    "role": "USER",
    "isActive": true,
    "avatarUrl": null
  }
}
```

Token sai/hết hạn: 401; tài khoản khóa: 403; cần liên kết tài khoản: 409; giới hạn yêu cầu: 429. Trả lỗi JSON có message, không ghi token vào log. CORS cho phép origin FE hiện dùng.

## Sau khi triển khai BE

Đăng nhập Google trên FE, kiểm tra POST /api/auth/google trả 200 và userId; đối chiếu người dùng trong DB, đăng nhập lại không tạo thêm dòng. GET /api/users/me phải nhận JWT BE và trả cùng userId. Đây là các bước kiểm tra đề xuất, chưa được thực hiện trong lượt sửa FE.
