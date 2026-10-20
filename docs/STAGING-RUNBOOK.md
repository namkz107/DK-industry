# Staging runbook — DK Industry

Tài liệu này chuẩn bị và xác minh **staging**. Không dùng để deploy production.
Không dán secret, token, private key, URI có credentials hoặc age identity vào
ticket, chat hoặc commit.

Trạng thái máy phát triển hiện tại (cập nhật khi thay đổi): các binary Docker,
Nginx, age, mongodump/mongorestore và ClamAV có thể **chưa có**. Chỉ đánh dấu một
hạng mục đã kiểm chứng khi lệnh tương ứng đã chạy và đạt kết quả kỳ vọng.

## 0. Điều kiện tiên quyết

| Thành phần | Mục đích | Cài đặt gợi ý |
|---|---|---|
| Docker Engine + Compose v2 | Build/up Compose, ClamAV container | Docker Desktop hoặc engine chính thức |
| Nginx (trong image `nginx:1.27-alpine`) | `nginx -t` trong container web | Theo Dockerfile frontend |
| age + age-keygen | Backup mã hóa | https://github.com/FiloSottile/age |
| MongoDB Database Tools | mongodump / mongorestore | MongoDB Database Tools chính thức |
| ClamAV daemon | Scanner thật (Compose service `clamav`) | Image `clamav/clamav:1.4` qua Compose |
| Node.js ≥ 20.19 | Preflight, unit/integration, smoke | Node LTS |

Secrets staging phải **khác** production: `JWT_SECRET`, `MFA_ENCRYPTION_KEY`,
SMTP, Cloudinary, Groq, Admin seed, `BACKUP_AGE_RECIPIENT` và MongoDB URI.

Database staging phải riêng (ví dụ `dk_industry_staging`) hoặc Atlas project
riêng. Chỉ dùng dữ liệu giả hoặc đã khử định danh. Database test restore phải
kết thúc bằng `_test` hoặc `-test`.

## 1. Chuẩn bị cấu hình staging (không commit)

```powershell
Copy-Item backend/.env.production.example backend/.env.production
Copy-Item frontend/.env.production.example frontend/.env.production
Copy-Item compose.production.env.example compose.production.env
```

Trên host staging, điền **giá trị staging** vào các file trên. Compose hiện đọc
`backend/.env.production` và frontend build đọc `frontend/.env.production` —
đặt tên file theo Compose/Dockerfile nhưng nội dung phải là staging.

Checklist tối thiểu trong env staging:

- `CLIENT_URL` / `VITE_SITE_URL` = HTTPS origin staging
- `MONGODB_URI` trỏ database staging (không phải production, không phải DB test CI)
- `COOKIE_SECURE=true`, `TRUST_PROXY` đúng số hop, `ENFORCE_SESSION_CHECK=true`
- `CLAMAV_HOST=clamav` (Compose) — không publish cổng 3310
- `BACKUP_AGE_RECIPIENT` = public recipient staging riêng
- `WEB_BIND_ADDRESS=127.0.0.1` (proxy cùng máy) hoặc IP private đã firewall

```powershell
npm run preflight:production
```

**Expected:** JSON `"ok": true`. Script không in giá trị secret.

**Rollback:** xóa hoặc đổi tên file env staging; không commit chúng.

## 2. Kiểm chứng tĩnh (có thể chạy không cần Docker)

```powershell
npm run test:deployment-security
npm run test:backup-security
npm run test:preflight
npm test --prefix backend -- test/malware-scan.test.js
npm run lint --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm run scan:client-bundle
```

**Expected:** toàn bộ pass; bundle scan không báo candidate.

## 3. Docker Compose — config / build / up

Chỉ chạy khi `docker` và `docker compose` có trong PATH.

```powershell
docker compose --env-file compose.production.env -f compose.production.yml config
docker compose --env-file compose.production.env -f compose.production.yml build
docker compose --env-file compose.production.env -f compose.production.yml up -d
docker compose --env-file compose.production.env -f compose.production.yml ps
```

**Expected:**

- `config` không lỗi; `WEB_BIND_ADDRESS` đã resolved
- `clamav` healthy; `api` healthy sau clamav; `web` healthy
- `docker compose ... port clamav` / inspect: **không** có published host port cho 3310
- Chỉ `web` bind theo `WEB_BIND_ADDRESS:WEB_PORT`

**Rollback:**

```powershell
docker compose --env-file compose.production.env -f compose.production.yml down
```

Không dùng `--volumes` trừ khi chủ đích xóa signature ClamAV staging.

**Lưu ý chưa xác minh trên máy thiếu Docker:** healthcheck ClamAV dùng `nc`.
Nếu image không có `nc`, service sẽ không healthy — sửa healthcheck trên staging
rồi ghi lại evidence trước khi coi scanner đã sẵn sàng.

### Nginx config test trong container

```powershell
docker compose --env-file compose.production.env -f compose.production.yml exec web nginx -t
```

**Expected:** `syntax is ok` / `test is successful`.

Xác minh thêm: response từ reverse proxy có `Referrer-Policy: no-referrer`; access
log không chứa query string hoặc Referer (đối chiếu file log thật trên host).

## 4. ClamAV integration (chỉ file sạch và EICAR)

Không dùng malware thật. EICAR là chuỗi kiểm thử chuẩn của industry.

1. Đợi ClamAV cập nhật signature (xem log container, thường vài phút lần đầu).
2. Đăng nhập Customer staging đã verify email.
3. Upload PDF sạch hợp lệ → **Expected:** tạo request thành công; `scanStatus=clean`; download được.
4. Upload chứa nội dung EICAR với extension/MIME được allowlist → **Expected:** HTTP 422; có bản ghi quarantine + audit; **không** tạo attachment trên request; không có download route.
5. `docker compose ... stop clamav` rồi upload → **Expected:** fail-closed (503/error); không gắn file vào hồ sơ.
6. Bật lại clamav; xác nhận health rồi upload sạch lại thành công.

Mock unit tests **không** thay thế các bước trên.

### Attachment cũ

Mọi attachment không có `scanStatus=clean` bị chặn download. Trên staging:

1. Liệt kê attachment thiếu/không clean.
2. Rescan từng object bằng quy trình vận hành; **không** bulk-set `clean` khi chưa quét.
3. Ghi số lượng rescanned / còn quarantine.

## 5. Backup / restore drill (database test, dữ liệu giả)

Chỉ khi `age`, `age-keygen`, `mongodump`, `mongorestore` có sẵn. Dùng URI **test**
và identity ngoài repository/server/backup storage.

```powershell
# Máy quản lý khóa tách biệt (không trên app server)
age-keygen -o D:\secure\dk-industry-staging-backup.agekey
# Chỉ đưa dòng public age1... vào BACKUP_AGE_RECIPIENT trên máy backup

$env:BACKUP_AGE_RECIPIENT = "age1..."   # public only
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/dk_industry_staging_seed_test"
npm run backup:db
```

**Expected:** file `*.archive.gz.age` + `*.age.sha256`; không còn plaintext trong TEMP.

```powershell
$env:BACKUP_AGE_IDENTITY_FILE = "D:\secure\dk-industry-staging-backup.agekey"
.\scripts\restore-mongodb.ps1 `
  -Archive ".\backups\dk-industry-YYYYMMDD-HHMMSS.archive.gz.age" `
  -Uri "mongodb://127.0.0.1:27017/dk_industry_restore_test" `
  -SourceDatabase "dk_industry_staging_seed_test" `
  -TargetDatabase "dk_industry_restore_test"
```

**Expected:** restore OK; smoke login/products trên DB restore; xóa identity tạm khỏi máy restore.

**Rollback:** drop database `_test` đã restore; giữ ciphertext.

## 6. HTTPS, cookie, CORS, firewall, proxy

Thứ tự xác minh trên staging có TLS thật (Cloudflare hoặc reverse proxy):

1. Origin bind `127.0.0.1` hoặc private IP; firewall chỉ cho phép proxy/Cloudflare.
2. Từ Internet: request trực tiếp tới IP:8080 **phải thất bại**.
3. Qua domain HTTPS: cookie `Secure`, `SameSite` đúng; refresh/logout cần CSRF.
4. `TRUST_PROXY` khớp số hop; rate limit không gom mọi client về một IP.
5. CORS chỉ allow origin staging trong `CLIENT_URL`.
6. Nginx truyền `X-Forwarded-Proto` từ proxy phía client (không ghi đè bằng `$scheme`
   của container HTTP). HSTS chỉ khi client-facing HTTPS.

## 7. Phân quyền và realtime

Dùng bốn tài khoản synthetic: Customer, Staff A, Staff B, Admin (MFA).

| Kiểm tra | Expected |
|---|---|
| Staff B đọc/tải hồ sơ của Staff A | 404 |
| Staff B join room trước claim, Staff A claim, rồi Staff A gửi internal note | Staff B không nhận payload |
| Logout / revoke session khi socket đang mở | Socket disconnect; reconnect bị từ chối |
| Admin chưa MFA gọi `/api/admin` | `MFA_ENROLLMENT_REQUIRED` hoặc verification required |
| Customer chỉ thấy đơn/request của mình | Cross-ID 404 |

### Nhiều API instance

Compose mẫu chạy **một** container `api`. Registry thu hồi socket là **in-process**.

Nếu scale `api` > 1 replica: **chưa giải quyết**. Cần Socket.IO adapter/pub-sub
chung (ví dụ Redis) và regression test revoke xuyên node trước khi coi realtime
session revocation đã hoàn tất trên kiến trúc đó. Đừng đánh dấu đã xong chỉ vì
test single-instance pass.

## 8. Bootstrap Admin staging

```powershell
docker compose --env-file compose.production.env -f compose.production.yml exec api node src/bootstrapAdmin.js
```

Bật MFA, cất recovery codes, **xóa** `ADMIN_SEED_PASSWORD` khỏi env rồi recreate API.

## 9. Smoke và UAT

```powershell
npm run smoke:production -- https://staging.example
```

Sau đó chạy [UAT-CHECKLIST.md](UAT-CHECKLIST.md) trên staging.

## 10. Historical Google-like key (operator)

Không in giá trị key. Tham chiếu đã che:

- Commit: `3bcb4e5ac823a058fa2839f48d9755f2d3436f08`
- File lịch sử: `scripts/preflight.test.js` dòng 18
- Fingerprint SHA-256 prefix (không phải secret): `c643f210ba377c1f`

Người có quyền Google Cloud:

1. API & Services → Credentials; đối chiếu metadata/key ID với fingerprint/
   thời điểm commit; **không** dán raw key vào báo cáo.
2. Nếu từng hợp lệ: revoke hoặc rotate; coi Git history đã lộ giá trị.
3. Giới hạn referrer/IP/API theo loại key; kiểm billing/audit trước và sau.
4. Ghi trạng thái operator: `NOT FOUND` / `REVOKED` / `ROTATED` / `RESTRICTED` + ngày.

Không rewrite Git history trong nhiệm vụ này.

## 11. Rollback tổng quát staging

1. `docker compose ... down` (giữ volume signature nếu cần).
2. Khôi phục image/tag trước nếu build mới lỗi.
3. Không restore đè database staging từ bản không rõ nguồn; chỉ restore vào `*_test`.
4. Giữ ít nhất hai release image gần nhất.

## 12. Gate trước khi cân nhắc production

Staging chỉ được coi là sẵn sàng khi **tất cả** mục sau có evidence thật:

- [ ] Docker Compose build/up + ClamAV healthy (không publish 3310)
- [ ] `nginx -t` trong container web
- [ ] ClamAV: clean + EICAR + scanner stop fail-closed
- [ ] Rescan/quarantine plan cho attachment không `clean`
- [ ] age backup + restore vào `*_test`
- [ ] Origin không bypass được TLS/Cloudflare từ Internet
- [ ] Cookie Secure / CORS / trust proxy đã xác minh qua chuỗi proxy thật
- [ ] UAT bốn vai trò + realtime revoke
- [ ] Nếu >1 API replica: Socket.IO adapter/pub-sub đã triển khai và test
- [ ] Operator xác nhận historical key (`REVOKED`/`ROTATED`/`NOT FOUND`)

Thiếu bất kỳ mục nào → **không** tuyên bố production-ready.
