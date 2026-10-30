# Quy trình đưa DK Industry lên staging/production

Mã nguồn không khóa vào một nhà cung cấp hosting. Có thể dùng VPS, dịch vụ chạy Docker Compose hoặc tách hai image `api` và `web` lên các dịch vụ container khác nhau.

Trước production, làm theo runbook kiểm chứng runtime:
[`STAGING-RUNBOOK.md`](STAGING-RUNBOOK.md). Không tuyên bố production-ready chỉ
vì unit/mock/static checks đạt trên máy thiếu Docker/ClamAV/age.

## 1. Chuẩn bị cấu hình

```powershell
Copy-Item backend/.env.production.example backend/.env.production
Copy-Item frontend/.env.production.example frontend/.env.production
```

Điền các giá trị còn thiếu. Nếu dùng cấu hình Nginx kèm dự án, giữ `VITE_API_URL=/api` và để trống `VITE_SOCKET_URL`; API và Socket.IO sẽ dùng cùng domain với website.

Đặt `RELEASE_SHA` bằng kết quả `git rev-parse HEAD` của đúng commit được deploy. Giá trị này xuất hiện trong health endpoint để đối chiếu release khi giám sát hoặc rollback.

Không commit hai file `.env.production`. Toàn bộ khóa bí mật phải nằm trong secret manager hoặc biến môi trường của hosting.

### Tự động cập nhật production sau khi CI thành công

Vercel phải theo dõi nhánh `master` và bật **Auto-assign Custom Production Domains**. Các file `vercel.json` ở repository và trong `frontend` cùng giữ fallback về `index.html` cho cả hai cách cấu hình Root Directory, vì vậy mở thẳng hoặc tải lại các URL SPA như `/admin`, `/admin/xuong` sẽ không còn trả trang 404 của Vercel.

Backend `api.cokhidangkhoa.com` chạy độc lập với Vercel. Job `deploy_backend_production` trong `.github/workflows/ci.yml` chỉ chạy khi toàn bộ job `verify` đạt và sự kiện là push lên `master`. Cấu hình một lần các repository secrets sau trong **GitHub → Settings → Secrets and variables → Actions**:

- `PRODUCTION_HOST`: hostname hoặc IP của VPS chạy API.
- `PRODUCTION_PORT`: cổng SSH; có thể bỏ trống nếu dùng `22`.
- `PRODUCTION_USER`: tài khoản SSH có quyền chạy Docker Compose trong thư mục ứng dụng.
- `PRODUCTION_SSH_PRIVATE_KEY`: private key dành riêng cho GitHub Actions; không dùng mật khẩu tài khoản cá nhân.
- `PRODUCTION_KNOWN_HOSTS`: dòng khóa host đã kiểm tra trước của VPS, tạo từ máy tin cậy bằng `ssh-keyscan -H <host>` rồi đối chiếu fingerprint trên VPS.
- `PRODUCTION_APP_DIR`: đường dẫn tuyệt đối tới repository trên VPS, ví dụ `/srv/dk-industry`.

Sau khi đủ secrets, tạo repository variable `PRODUCTION_DEPLOY_ENABLED=true` (cùng trang, tab **Variables**) để bật job; xóa hoặc đổi giá trị khác để tạm dừng deploy tự động.

Trên VPS, `compose.production.env` phải có `API_BIND_ADDRESS=127.0.0.1` và `API_PORT` trùng cổng mà Nginx của `api.cokhidangkhoa.com` proxy tới (hiện là `5050`).

Trên VPS, repository phải có remote `origin`, đọc được nhánh `master`, không có thay đổi cục bộ chưa commit và tài khoản deploy phải chạy được `docker compose`. Workflow dùng `git pull --ff-only`, build/recreate riêng service `api`, truyền đúng `RELEASE_SHA`, rồi chỉ báo thành công khi `https://api.cokhidangkhoa.com/api/live` trả đúng commit cùng `apiContract >= 2`.

Không cần promote thủ công các deployment Vercel sau khi Production Branch đã là `master`. Một lần push lên `master` sẽ kích hoạt Vercel cho frontend và CI cho backend; backend chỉ đổi phiên bản sau khi kiểm tra đạt.

## 2. Chạy cổng kiểm tra trước deploy

```powershell
npm run preflight:production
npm run check
npm run audit:prod
```

`preflight:production` phải kết thúc với `"ok": true`. Script kiểm tra HTTPS, database, secret, cookie, SMTP/TLS, DKIM selector, Cloudinary, thông tin doanh nghiệp, phiên bản chính sách và sự đồng bộ origin frontend/backend mà không in giá trị bí mật. Sau khi DNS thật đã hoạt động, chạy `npm run verify:integrations --prefix backend` trong đúng môi trường deploy; lệnh phải tìm thấy SPF, DKIM, DMARC và gửi được email thử. Preflight tĩnh không thay thế kiểm tra DNS này.

## 3. Chạy staging bằng Docker Compose

```powershell
Copy-Item compose.production.env.example compose.production.env
docker compose --env-file compose.production.env -f compose.production.yml config
docker compose --env-file compose.production.env -f compose.production.yml build --pull api web
docker compose --env-file compose.production.env -f compose.production.yml up -d --force-recreate api web
docker compose --env-file compose.production.env -f compose.production.yml ps
```

`WEB_BIND_ADDRESS` bắt buộc phải được chọn rõ ràng. Khi reverse proxy chạy cùng
máy, dùng `127.0.0.1`; khi proxy chạy máy khác, dùng private interface và firewall
chỉ cho phép proxy truy cập. Không dùng `0.0.0.0` trước khi đã khóa firewall theo
IP proxy/Cloudflare và kiểm thử rằng origin không thể truy cập trực tiếp từ
Internet. Dịch vụ `api` chỉ giao tiếp trong mạng Compose.

Nếu cấu hình bind mới làm reverse proxy mất kết nối, rollback bằng cách khôi phục
địa chỉ private/bind cũ trong `compose.production.env`, chạy lại `docker compose
up -d`, rồi kiểm tra từ proxy. Không mở tạm cổng origin ra Internet để xử lý lỗi.

Compose còn chạy ClamAV trên mạng nội bộ bằng `expose`, không dùng `ports`.
Container API chỉ healthy sau khi scanner healthy. Trước khi nhận upload thật,
kiểm tra signature database đã cập nhật, gửi EICAR trong staging, thử dừng
scanner và xác nhận upload trả lỗi fail-closed. Không đánh dấu scanner đã kiểm
thử chỉ vì static Compose test đạt.

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

Truyền commit đang deploy để smoke test từ chối backend cũ (tránh frontend mới
gọi route chưa có trong API container):

```powershell
npm run smoke:production -- https://ten-mien-thuc-te.vn --expect-release=<git-commit-sha>
```

Health response phải có `apiContract >= 2`; contract này bao gồm các route theo
dõi dự án `/api/customer/projects` và `/api/admin/work-orders`.

Smoke test xác minh website, security headers, API liveness/readiness, SPA fallback, robots và sitemap. Sau đó chạy toàn bộ [UAT-CHECKLIST.md](UAT-CHECKLIST.md) bằng bốn tài khoản thử.

## 6. Backup và khôi phục

- Cài `age` và MongoDB Database Tools; cấu hình public `BACKUP_AGE_RECIPIENT` theo [`BACKUP-ENCRYPTION.md`](BACKUP-ENCRYPTION.md).
- Lập lịch `npm run backup:db` ít nhất mỗi ngày và chỉ chuyển file `.archive.gz.age` cùng `.age.sha256` sang vùng lưu trữ khác máy chủ.
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
