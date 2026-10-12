# Trạng thái hoàn thiện trước triển khai

Tài liệu này là mốc nghiệm thu code trước khi deploy. Việc chưa deploy không ngăn đội phát triển hoàn thiện và kiểm tra toàn bộ chức năng local/Atlas.

## Đã có trong mã nguồn

- Backend kiểm tra bắt buộc `MONGODB_URI`, độ mạnh `JWT_SECRET`, origin, cookie và cấu hình lưu tệp ngay khi khởi động.
- Access token ngắn hạn, refresh token HttpOnly, xoay token, thu hồi phiên, RBAC Customer/Staff/Admin và rate limit.
- MongoDB Atlas hỗ trợ transaction; API từ chối cấu hình production không an toàn.
- Upload kiểm tra phần mở rộng, kích thước và chữ ký thật của tệp. Local dùng ổ đĩa; production có thể dùng Cloudinary. Tệp hồ sơ khách dùng loại `authenticated` và liên kết tải có thời hạn.
- `/api/live` kiểm tra tiến trình; `/api/ready` và `/api/health` kiểm tra cả kết nối database.
- Có request ID, log JSON trong production và graceful shutdown khi nhận `SIGTERM`/`SIGINT`.
- Có script backup/restore MongoDB và workflow CI chạy integration test, lint, build, audit dependency production.

## Cách nghiệm thu trên máy hiện tại

```powershell
npm run check
npm run audit:prod
npm run backup:db
```

Sau backup, ghi lại đường dẫn và SHA256 được in ra. Ít nhất một lần trước go-live, phục hồi bản backup vào **database thử nghiệm riêng**, không phục hồi đè vào database thật:

```powershell
.\scripts\restore-mongodb.ps1 -Archive ".\backups\dk-industry-YYYYMMDD-HHMMSS.archive.gz" -Uri "mongodb+srv://.../dk_industry_restore_test"
```

Script restore luôn yêu cầu nhập chính xác `RESTORE`. Chỉ dùng `-DropExisting` với database thử nghiệm đã kiểm tra đúng tên.

## Cấu hình phải điền trước deploy

- Backend: đặt `NODE_ENV=production`, `CLIENT_URL=https://...`, `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=lax` (cùng site) hoặc `none` (khác site), `TRUST_PROXY`, SMTP và email liên hệ Nominatim.
- Lưu tệp: đặt `FILE_STORAGE_DRIVER=cloudinary` cùng `CLOUDINARY_URL`, hoặc bộ ba `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Tuyệt đối không đưa API secret sang frontend.
- Frontend: điền `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_SITE_URL`, hình Cloudinary công khai và thông tin pháp lý `VITE_COMPANY_*`.
- Atlas: chỉ cho phép IP thực sự cần dùng; tạo database user riêng cho ứng dụng; không dùng tài khoản Atlas cá nhân trong connection string; kiểm tra quota free tier.

## Việc cần quyết định từ doanh nghiệp

Các mục sau không thể tự điền bằng code vì cần hợp đồng, tài khoản hoặc dữ liệu pháp lý thật:

- SMTP/email gửi thật và địa chỉ người nhận thông báo vận hành.
- Phương án geocoding khi lưu lượng vượt mức phù hợp của máy chủ Nominatim công khai (tự host hoặc nhà cung cấp có SLA).
- Tên pháp lý, mã số thuế/đăng ký, người đại diện, địa chỉ, hotline và nội dung chính sách đã được duyệt.
- Cổng thanh toán, hãng vận chuyển, hóa đơn điện tử và quy tắc đối soát/hoàn tiền.
- Tên miền, nhà cung cấp hosting, cảnh báo lỗi/log tập trung và lịch backup.

Không đánh dấu dự án “sẵn sàng go-live” cho tới khi từng mục trên có chủ sở hữu, giá trị thật và kết quả kiểm thử chấp nhận.
