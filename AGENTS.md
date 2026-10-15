<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Quy định cho mọi trang và component mới

Áp dụng các quy định dưới đây khi tạo hoặc sửa giao diện trong dự án. Đọc và tái sử dụng code hiện có trước khi tạo giải pháp mới.

### Song ngữ tiếng Anh / tiếng Việt

- Mọi chữ giao diện mới phải hỗ trợ cả EN và VI ngay trong cùng thay đổi: tiêu đề, nhãn, nút, placeholder, tooltip, tên truy cập (`aria-label`), thông báo xác thực, lỗi, thành công, trạng thái tải và trạng thái trống.
- Sử dụng `LanguageContext` tại `src/context/LanguageContext.tsx`. Không tạo state ngôn ngữ, khóa localStorage hoặc bộ chuyển ngôn ngữ riêng cho từng trang.
- Đưa chữ dùng chung vào `src/lib/ui-translations.ts`; hiển thị bằng `UiText` hoặc `useUiText()` từ `src/components/UiText.tsx`. Có thể dùng `t(english, vietnamese)` từ `useLanguage()` cho câu riêng của component. Không để nhãn trộn hai ngôn ngữ như `Servings (Khẩu phần)`.
- Với Server Component, có thể dùng `UiText` là Client Component con. Chỉ chuyển phần cần tương tác sang Client Component; không chuyển cả trang chỉ để dịch một dòng chữ.
- Thông báo đang hiển thị cũng phải đổi khi người dùng chuyển EN/VI. Giữ mã thông báo và dữ liệu thay thế, hoặc dịch chuỗi đã biết tại lúc render; tránh lưu duy nhất câu đã dịch trong state.
- Dùng `locale` từ `useLanguage()` để định dạng ngày, giờ và số hiển thị. Giữ nguyên giá trị kỹ thuật gửi API như `BLOG`, `RECIPE`, `PLANT`, ID và URL; chỉ dịch nhãn hiển thị của chúng.
- Không tự sửa hoặc dịch nội dung người dùng nhập, bài viết, tên riêng hay phản hồi AI/BE tùy ý. Chuyển EN/VI phải giữ nguyên dữ liệu đang nhập. Dịch nội dung bài là tính năng riêng, không đồng nghĩa với dịch giao diện.
- Không cần cài dịch vụ dịch bên thứ ba cho chữ giao diện. Nếu thêm thư viện i18n, phải tích hợp với ngôn ngữ chung hiện có, không tạo hai cơ chế độc lập.
- Khi kiểm tra trang, thử cả EN và VI, chuyển ngôn ngữ ngay khi đang nhập và kiểm tra trên màn hình hẹp để tránh mất dữ liệu, tràn chữ hoặc sót nhãn chưa dịch.

### Hiệu ứng và trạng thái tải dùng chung

- Tái sử dụng `src/components/ui/Reveal.tsx` cho phần nội dung xuất hiện khi cuộn, `CardSkeleton.tsx` cho danh sách đang tải và `FeedImage.tsx` cho ảnh thẻ bài phù hợp.
- Tái sử dụng các class trong `src/app/globals.css`: `vm-card`, `vm-button`, `vm-popover`, `vm-dialog`, `vm-feedback`, `vm-enter`, `vm-stagger` và `vm-skeleton`. Kiểm tra cách dùng hiện tại trước khi gắn class.
- Dùng hiệu ứng nhẹ và nhất quán, thông thường khoảng 150–250 ms cho tương tác. Không thêm chuyển động cho mọi phần tử hoặc tạo độ trễ giả để phô diễn loading.
- Chỉ hiện skeleton/spinner khi thật sự đang chờ dữ liệu. Nút gửi phải phản ánh trạng thái xử lý và ngăn gửi lặp; chỉ báo thành công sau khi API xác nhận thành công.
- Ảnh đầu trang quan trọng phải tải ngay; ảnh phía dưới có thể lazy-load. Giữ tỷ lệ/kích thước khung ảnh để tránh xô lệch bố cục và có trạng thái thay thế khi ảnh lỗi.
- Hiệu ứng mới phải tôn trọng `prefers-reduced-motion`, không làm nội dung mất khả năng truy cập khi JavaScript chưa chạy và không ảnh hưởng thao tác bàn phím hoặc focus.
- Dùng lại navbar, footer, hộp thoại và thành phần chung phù hợp. Không sao chép thành phiên bản riêng khiến ngôn ngữ hoặc hiệu ứng giữa các trang lệch nhau.
- Không tự cài thêm thư viện hiệu ứng nếu component/CSS hiện có đã đáp ứng yêu cầu. Khi cần thư viện mới, tập trung cấu hình vào thành phần dùng chung để các trang sau có thể tái sử dụng.

### Kiểm tra trước khi bàn giao

- Chạy TypeScript và ESLint phù hợp với phần thay đổi; chạy build khi thay đổi ảnh hưởng cấu trúc trang, import hoặc hành vi runtime.
- Báo đúng những gì đã kiểm tra. Không khẳng định API chạy thật nếu chỉ kiểm tra code hoặc phản hồi giả lập; không khẳng định mọi trang đã hỗ trợ song ngữ chỉ vì đã thêm từ điển.
- Không tự commit, push, đổi nhánh hoặc sửa cấu hình môi trường ngoài phạm vi yêu cầu.
