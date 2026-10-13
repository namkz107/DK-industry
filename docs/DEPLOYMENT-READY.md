# Quy trình đưa DK Industry lên staging/production

Mã nguồn không khóa vào một nhà cung cấp hosting. Có thể dùng VPS, dịch vụ chạy Docker Compose hoặc tách hai image `api` và `web` lên các dịch vụ container khác nhau.

## 1. Chuẩn bị cấu hình

```powershell
Copy-Item backend/.env.production.example backend/.env.production
Copy-Item frontend/.env.production.example frontend/.env.production
```

Điền các giá trị còn thiếu. Nếu dùng cấu hình Nginx kèm dự án, giữ `VITE_API_URL=/api` và để trống `VITE_SOCKET_URL`; API và Socket.IO sẽ dùng cùng domain với website.

Đặt `RELEASE_SHA` bằng kết quả `git rev-parse HEAD` của đúng commit được deploy. Giá trị này xuất hiện trong health endpoint để đối chiếu release khi giám sát hoặc rollback.

Không commit hai file `.env.production`. Toàn bộ khóa bí mật phải nằm trong secret manager hoặc biến môi trường của hosting.

## 2. Chạy cổng kiểm tra trước deploy

```powershell
npm run preflight:production
npm run check
npm run audit:prod
```

`preflight:production` phải kết thúc với `"ok": true`. Script kiểm tra HTTPS, database, secret, cookie, SMTP, Cloudinary, thông tin doanh nghiệp, phiên bản chính sách và sự đồng bộ origin frontend/backend mà không in giá trị bí mật.

## 3. Chạy staging bằng Docker Compose

```powershell
docker compose -f compose.production.yml config
docker compose -f compose.production.yml build
docker compose -f compose.production.yml up -d
docker compose -f compose.production.yml ps
```

Web mặc định mở cổng `8080`. Trên hosting thật, đặt TLS/reverse proxy của nhà cung cấp phía trước cổng này. Chỉ expose dịch vụ `web`; dịch vụ `api` chỉ giao tiếp trong mạng Compose.

## 4. Khởi tạo tài khoản quản trị

Chỉ giữ `ADMIN_SEED_PASSWORD` trong lúc bootstrap:

```powershell
docker compose -f compose.production.yml exec api node src/bootstrapAdmin.js
```

Sau khi đăng nhập và bật MFA thành công, xóa `ADMIN_SEED_PASSWORD` khỏi môi trường rồi recreate container API. Cất recovery codes trong password manager.

## 5. Kiểm tra sau deploy

```powershell
npm run smoke:production -- https://ten-mien-thuc-te.vn
```

Smoke test xác minh website, security headers, API liveness/readiness, SPA fallback, robots và sitemap. Sau đó chạy toàn bộ [UAT-CHECKLIST.md](UAT-CHECKLIST.md) bằng bốn tài khoản thử.

## 6. Backup và khôi phục

- Lập lịch `npm run backup:db` ít nhất mỗi ngày và chuyển file `.archive.gz` cùng `.sha256` sang vùng lưu trữ khác máy chủ.
- Thiết lập retention theo yêu cầu doanh nghiệp; không chỉ giữ backup trên cùng VPS.
- Trước go-live, khôi phục một bản vào database có hậu tố `_test`, kiểm tra đăng nhập, sản phẩm, đơn hàng và yêu cầu kỹ thuật.
- Ghi lại thời gian khôi phục thực tế để xác định RTO/RPO.

## 7. Giám sát tối thiểu

- Uptime monitor gọi `/api/ready` mỗi 1–5 phút và cảnh báo khi khác HTTP 200.
- Thu thập stdout/stderr JSON của API vào log tập trung; gắn `RELEASE_SHA` khi deploy.
- Cảnh báo lỗi 5xx, container restart, CPU/RAM/disk, quota Atlas, quota Cloudinary và email gửi thất bại.
- Không dùng `/api/live` thay cho readiness: tiến trình có thể còn sống khi database đã mất kết nối.

## Rollback

1. Giữ image của ít nhất hai release gần nhất, được gắn tag bằng commit SHA.
2. Nếu release mới lỗi, chuyển web/API về image trước; không tự rollback database schema nếu chưa có kế hoạch dữ liệu.
3. Chạy lại smoke test và đối chiếu `/api/live` trả đúng `release`.
4. Nếu sự cố dữ liệu, ngừng ghi và làm theo quy trình restore đã diễn tập; không restore đè production một cách trực tiếp.
