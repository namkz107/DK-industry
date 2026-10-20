# Theo dõi remediation Security Audit

Tài liệu này không chứa giá trị secret. Không dán key, token, URI có credentials
hoặc private identity vào issue, log hay chat.

## Secret-like value trong lịch sử Git

- Commit: `3bcb4e5ac823a058fa2839f48d9755f2d3436f08`
- File: `scripts/preflight.test.js`
- Dòng lịch sử: 18
- Loại được nhận diện: chuỗi có định dạng Google API key
- Giá trị: `[REDACTED]`
- Fingerprint nội bộ (SHA-256 prefix, không phải secret): `c643f210ba377c1f`

Không tự động rewrite lịch sử Git. Người có quyền trên Google Cloud cần:

1. Mở API & Services → Credentials và đối chiếu key theo metadata/provider log
   hoặc thời điểm tạo gần commit trên; không sao chép giá trị key vào báo cáo.
2. Nếu key từng hợp lệ, revoke hoặc rotate ngay cả khi hiện không còn trong
   branch; Git history phải được coi là đã công khai giá trị.
3. Với key frontend bắt buộc công khai, giới hạn HTTP referrer đúng domain và
   chỉ bật API cần dùng; với server key, giới hạn IP/service account và không
   đưa vào biến `VITE_*`.
4. Kiểm tra billing/audit log cho hoạt động bất thường trước và sau rotation.
5. Ghi trạng thái operator vào phiếu vận hành: `NOT FOUND`, `REVOKED`,
   `ROTATED` hoặc `RESTRICTED`, kèm ngày xác nhận. Chi tiết lệnh nằm trong
   [`STAGING-RUNBOOK.md`](STAGING-RUNBOOK.md) mục 10.

## Bundle và release

CI chạy `npm run scan:client-bundle` sau production build. Scanner chỉ báo nhãn
và tên file, không in giá trị nghi ngờ. Trước release vẫn cần kiểm tra artifact
thực tế được deploy nếu hosting tự build bằng pipeline khác.

`.gitignore` chỉ cho phép các file `.env.example` và
`.env.production.example` đã được làm sạch. File `.env` thật, private key,
certificate bundle và age identity không được commit.

## Upload malware

Source code đã tích hợp giao thức ClamAV `INSTREAM`, retry có giới hạn và
fail-closed. Compose mẫu chạy ClamAV trong mạng nội bộ, không publish cổng
scanner. Chỉ file có kết quả `clean` mới được gắn vào hồ sơ; file `infected`
hoặc lỗi scanner được lưu private trong collection/kho quarantine, có audit và
không có download route. Download cũng từ chối mọi attachment không có
`scanStatus=clean`.

Unit/integration test dùng scanner mock đã phủ clean, EICAR/infected, timeout,
unavailable, phản hồi sai, retry, quarantine và chặn download. Máy phát triển
hiện chưa có Docker/ClamAV nên trạng thái là **FIXED IN CODE, INTEGRATION NOT
TESTED**. Trước production phải:

1. chạy ClamAV thật với signature database cập nhật;
2. gửi EICAR trong staging và xác nhận bị cách ly;
3. dừng scanner để xác nhận upload fail-closed;
4. rescan hoặc cách ly toàn bộ attachment cũ chưa có `scanStatus=clean` — source
   code cố ý chặn download các file cũ chưa được xác minh;
5. xác nhận maintenance xóa cả metadata và object quarantine khi hết retention.
