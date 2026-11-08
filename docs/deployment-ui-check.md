# Đối chiếu giao diện local và production — 08/11/2026

## Kết quả kiểm tra

- Local đang ở `Tri`, commit `797e304`; có thay đổi đã stage chưa commit.
- Sau `git fetch origin`, `origin/main` là `2c8633c`.
- Merge `3a80804` (Merge main into Tri and resolve restaurant UI conflict) thay homepage mới bằng bố cục cũ, bỏ BotanicalAccent và các class hero mới.
- Commit `3f3d2bb` tiếp tục bỏ form tìm kiếm homepage.
- HTML công khai tại https://veggie-mate-system.vercel.app/ chứa “Khám phá cuộc sống”, không chứa “Ăn xanh”. Điều này khớp homepage trong origin/main.
- CSS production vẫn chứa `vm-hover-foliage`, `vm-home-hero`, `vm-hero-foliage` và `/cursors/leaf.svg`. JavaScript layout vẫn chứa phần dây leo. URL cursor trả HTTP 200, kiểu image/svg+xml.
- Vì vậy không thể kết luận toàn bộ hiệu ứng bị mất do build. Hero bị thiếu markup; hover/cursor còn phụ thuộc thiết bị có `(hover: hover) and (pointer: fine)`, còn animation tôn trọng reduced motion.
- Chưa xác minh commit SHA trong dashboard Vercel và chưa kiểm thử hover trực tiếp trong trình duyệt production.

## Khi đưa thay đổi lên main

1. Xem lại thay đổi local trước khi commit; không bỏ các thay đổi đang stage.
2. Khi tích hợp main, giữ phần hero hiện tại của local: BotanicalAccent, class `vm-home-*`, CTA, và HeroRecipeCarousel. Đồng thời giữ các cập nhật tìm địa điểm/API từ main; không chép đè toàn bộ nhánh.
3. Kiểm tra diff của `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/ui/InteractionEffects.tsx` và `public/cursors/leaf.svg` trước khi merge.
4. Chạy TypeScript, ESLint và build. Xem thử bản production build với `npm start`.
5. Trong Vercel, đối chiếu Source commit của deployment Production với commit main vừa merge. Redeploy commit cũ không đưa source mới lên.
6. Kiểm tra hero, hover và cursor ở desktop; kiểm tra reduced motion và mobile riêng. Không tắt các điều kiện accessibility để ép hiệu ứng.

## Node và dependency

`eslint-visitor-keys@5.0.1` yêu cầu Node `^20.19.0 || ^22.13.0 || >=24`. Node 22.12.0 không thỏa điều kiện này. Dùng cùng một phiên bản Node LTS phù hợp trên máy và môi trường build. Trường engines chỉ khai báo yêu cầu, không nâng Node trên máy.

Sau khi nâng Node, dùng `npm ci` với package-lock đã commit để cài đúng dependency. Chạy `npm audit` trên đúng checkout đó. Kết quả audit ở checkout được kiểm tra hôm nay là 0 vulnerabilities; không dùng kết quả này để khẳng định checkout hoặc lockfile khác cũng sạch.

Không chạy `npm audit fix --force` để sửa lỗi giao diện. Cảnh báo deprecated ESLint là thông tin vòng đời công cụ, không phải bằng chứng gây mất animation trong trình duyệt.
