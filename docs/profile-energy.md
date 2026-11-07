# Ước tính TDEE trong hồ sơ

## Trạng thái UI hiện tại

Không hiện ghi chú tuổi/18 tuổi trên giao diện. Theo xác nhận mới khi triển khai bước tạo thực đơn, cho phép người dùng chọn mức vận động trong hồ sơ, đọc/lưu activityLevel qua API. FE không suy hệ số từ cân nặng hay năm sinh. Hồ sơ chưa hiển thị TDEE, nhưng bước xác nhận thực đơn có bản xem trước theo cùng công thức BE.

Hàm ước tính bên dưới được giữ để tham khảo/tích hợp sau, hiện không được trang hồ sơ gọi.

## Cơ chế đã chuẩn bị

- Giới tính hiện dùng MALE/FEMALE của BE; không mặc định giới tính hoặc mức vận động.
- Năm sinh, mức vận động đọc từ GET /api/users/me và lưu qua PUT /api/users/me/profile, dùng birthDate và activityLevel mà BE đã hỗ trợ.
- API mới đã hỗ trợ birthYear; FE ưu tiên đọc/gửi năm này. Với BE cũ dùng birthDate, gửi kèm YYYY-01-01 làm biểu diễn năm sinh khi đổi năm; giữ ngày/tháng cũ nếu năm không đổi. Không coi ngày quy ước là ngày sinh thực tế.
- Tuổi ước tính bằng năm hiện tại trừ năm sinh. Chỉ tính cho người từ 18 tuổi, năm sinh hợp lệ trong 120 năm gần đây, chiều cao/cân nặng hữu hạn trong giới hạn API và đã chọn mức vận động.
- Công thức năng lượng nghỉ Mifflin–St Jeor: 10 × cân nặng (kg) + 6,25 × chiều cao (cm) − 5 × tuổi + 5 (nam), hoặc − 161 (nữ).
- TDEE = năng lượng nghỉ × hệ số vận động: SEDENTARY 1,2; LIGHT 1,375; MODERATE 1,55; ACTIVE 1,725; VERY_ACTIVE 1,9. Mức hoạt động là thông tin người dùng chọn, không suy ra từ tuổi hay giới tính.
- Đây là ước tính năng lượng duy trì cân nặng, không phải kết quả AI hay chỉ tiêu điều trị. Kết quả chỉ tính để hiển thị, không gửi tdee lên API hoặc tự thay đổi mục tiêu thực đơn.
- Thiếu/xóa một đầu vào hoặc kết quả không hợp lệ thì ẩn toàn bộ phần TDEE; không dùng dữ liệu mặc định hay kết quả cũ. Chỉnh sửa tính lại ngay; Hủy khôi phục các giá trị đã lưu; Lưu lấy lại dữ liệu BE trả về.

Nguồn công thức: [Mifflin et al., 1990, PMID 2305711](https://pubmed.ncbi.nlm.nih.gov/2305711/).
Nguồn hệ số hoạt động: [US Coast Guard – Nutrition for Sports Performance](https://www.dcms.uscg.mil/Portals/10/CG-1/cg111/docs/HPM/Nutrition-for-Sports-Performance.pdf).
