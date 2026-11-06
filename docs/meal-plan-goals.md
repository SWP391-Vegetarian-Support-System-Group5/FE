# Bước chọn mục tiêu trước khi tạo thực đơn

## Phạm vi đã chốt

- Chỉ sửa FE, giữ API BE hiện tại. Người dùng chọn lại: 0 là duy trì; tăng/giảm nhận 500–1.000 kcal/ngày, không dùng thanh kéo liên tục 0–500 như đề xuất ban đầu.
- Bắt buộc đủ hồ sơ sức khỏe, kiểu ăn chay, dữ liệu dị ứng tải thành công và ít nhất một nguyên liệu sẵn có.
- Mức vận động trong hồ sơ được phép chọn thủ công theo xác nhận mới; không suy ra từ cân nặng/tuổi.

## Luồng

1. Bấm tạo/tạo lại: kiểm tra đăng nhập, GET hồ sơ mới nhất bằng JWT, xác minh giới tính/năm sinh/chiều cao/cân nặng/mức vận động/kiểu ăn chay và nguyên liệu/ngày bắt đầu.
2. Chưa đủ: không gọi POST tạo thực đơn; hiển thị danh sách thiếu, đường dẫn hồ sơ và phần nguyên liệu.
3. Đủ: mở ContentDialog dùng chung. BMI <18,5 gợi ý tăng; 18,5 đến dưới 25 gợi ý duy trì; từ 25 gợi ý giảm. Đây là sàng lọc, không chẩn đoán. Theo điều kiện BE hiện tại, ước tính calo áp dụng tuổi 18–120.
4. Người dùng chọn duy trì/tăng/giảm và mức điều chỉnh. Thiếu cân không chọn giảm; BMI cao không chọn tăng.
5. Xác nhận: GET lại hồ sơ, xác minh lại giới hạn và phiên đăng nhập; POST generate hoặc regenerate với startDate, availableIngredients, nutritionGoal và calorieAdjustment. Khóa thao tác khi đang xử lý; chỉ đổi thực đơn sau response thành công.

## Giới hạn FE

- Giá trị gửi: 0 → MAINTAIN, calorieAdjustment=null; khác 0 → LOSE/GAIN và 500–1.000, bước 50. Vị trí đầu thanh kéo là 0, tiếp theo 500/550/...; không có giá trị 1–499 gửi API.
- TDEE xem trước dùng cùng công thức Mifflin–St Jeor và hệ số vận động như NutritionProfileRules BE; sau lưu, phần tóm tắt chỉ hiển thị mục tiêu do BE trả về.
- Trần điều chỉnh của ứng dụng: min(1 kg/tuần, 1% cân hiện tại/tuần, khoảng cách tới biên cân nặng tham chiếu theo hướng chọn). Quy đổi năng lượng 7.700 kcal/kg chỉ phục vụ giới hạn/ước tính, không hứa hẹn giảm/tăng cân thực tế.
- Hướng giảm không vượt xuống dưới BMI 18,5; hướng tăng không vượt lên BMI 24,9 trong quy đổi một tuần. Thâm hụt còn bị chặn để lượng ăn mục tiêu không dưới 1.200 kcal/ngày (nữ) hoặc 1.500 (nam).
- Nếu không còn mức 500 phù hợp, giữ 0 và giải thích chọn duy trì. Kết quả mục tiêu dưới ngưỡng chế độ thì chặn xác nhận.
- Các giới hạn bổ sung này được áp dụng ở FE. BE vẫn giữ rule riêng hiện tại; không sửa DB, schema hay provider.
- Hiển thị rõ tuần đang xem và tuần dự kiến tạo, từ ngày bắt đầu đến ngày thứ bảy (start + 6), dùng UTC cho phép tính lịch để tránh lệch ngày.

## Hồ sơ và hợp đồng API

BE local hiện dùng birthYear thay birthDate, và có goalWeightKg. FE đọc birthYear, gửi cả birthYear và birthDate cho tương thích các bản cũ, giữ nguyên goalWeightKg khi lưu các trường khác. Không tự đổi cân nặng mục tiêu đã lưu.

## Nguồn tham khảo

- [CDC – Adult BMI Categories](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html).
- [CDC – Steps for Losing Weight](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html): giảm dần khoảng 1–2 lb/tuần, không phải cam kết cho từng người.
- [NHLBI – Obesity Evidence Review](https://www.nhlbi.nih.gov/sites/default/files/media/docs/obesity-evidence-review.pdf): các mức năng lượng ăn theo giới tính.
- [Mifflin et al., 1990](https://pubmed.ncbi.nlm.nih.gov/2305711/).

Không chạy test tự động hoặc gọi API tạo thực đơn thật trong lượt triển khai; kiểm tra TypeScript, ESLint và build riêng.
