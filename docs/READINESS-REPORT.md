# Báo cáo readiness gần nhất

Thời điểm kiểm tra: **2026-10-13 (Asia/Bangkok)**.

## Cổng chất lượng

- `npm run check`: đạt.
- Backend: 32/32 test đạt, gồm database integration, realtime, RBAC và Cloudinary.
- Frontend: 6/6 unit test đạt.
- Production preflight: 4/4 test đạt.
- Playwright: 6/6 smoke test đạt trên Chromium desktop và mobile.
- TypeScript/Vite production build: đạt.
- `npm audit`: 0 lỗ hổng ở dependency frontend; production backend/frontend đều 0 lỗ hổng.
- `git diff --check`: đạt, không có lỗi whitespace.

## Tích hợp và dữ liệu

- MongoDB Atlas ping: đạt.
- SMTP authentication: đạt; bước kiểm tra không gửi email.
- Bản đồ/địa chỉ: hiển thị, điểm ghim và chỉ đường dùng Google Maps không key; tìm kiếm và reverse geocoding dùng Nominatim/OpenStreetMap miễn phí với cache và giới hạn một yêu cầu mỗi giây. Không cần Google billing.
- Cloudinary upload/download/cleanup: đạt.
- Backup `dk-industry-20261013-083503.archive.gz`: SHA-256 khớp.
- Restore drill: khôi phục thành công 19 collection, 593 document và index vào `dk_industry_restore_test`, 0 document lỗi. Database thử đã được drop sau khi xác minh để không giữ bản sao dữ liệu vận hành.

## Phần đã chuẩn bị cho deployment

- Dockerfile riêng cho API và web.
- Nginx phục vụ SPA, cache asset, security headers, proxy API và WebSocket.
- Docker Compose mẫu có healthcheck và dependency readiness.
- Production environment template cho backend/frontend.
- Preflight chặn localhost, HTTP, secret yếu, placeholder, sai policy version và sai origin.
- Health endpoint trả version/release nhưng không công khai trạng thái từng integration.
- Sitemap/robots được sinh theo domain trong production build.
- Smoke test sau deploy kiểm tra HTTPS website, API, security headers, SPA fallback và SEO files.
- Checklist UAT cho Customer, Staff, Admin, realtime, email, backup và quyền riêng tư.

## Việc cố ý để lại tới lúc chốt triển khai

1. Điền domain HTTPS, hosting và `RELEASE_SHA`.
2. Điền/xác nhận tên pháp lý, mã số thuế/đăng ký, người đại diện và nội dung chính sách.
3. Cấu hình TLS, uptime monitor, log/alert và lịch backup trên nhà cung cấp đã chọn.
4. Build hai container trên môi trường có Docker và chạy smoke test với URL thật.
5. Chạy UAT có người dùng bằng bốn tài khoản thử và ký nghiệm thu.

Cổng thanh toán, API vận chuyển và hóa đơn điện tử không bắt buộc cho đợt thử nghiệm nếu tiếp tục dùng COD/chuyển khoản cùng đối soát thủ công.
