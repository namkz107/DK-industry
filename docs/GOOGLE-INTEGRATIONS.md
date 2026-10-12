# Gmail SMTP và OpenStreetMap

## 1. Gmail SMTP miễn phí cho môi trường hiện tại

Tài khoản gửi: `namkz107@gmail.com`.

1. Mở `https://myaccount.google.com/security` và bật **Xác minh 2 bước**.
2. Mở `https://myaccount.google.com/apppasswords`.
3. Tạo App Password với tên `DK Industry local`.
4. Google hiển thị mật khẩu 16 ký tự một lần. Dán trực tiếp vào dòng `SMTP_PASS=` trong `backend/.env`. Không gửi App Password qua chat và không dùng mật khẩu Google thông thường.
5. Không commit `backend/.env`; file này đã nằm trong `.gitignore`.

Cấu hình đã chuẩn bị:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=namkz107@gmail.com
SMTP_PASS=
EMAIL_FROM="DK Industry <namkz107@gmail.com>"
SMTP_TEST_TO=namkz107@gmail.com
```

Gmail cá nhân phù hợp cho phát triển và lượng email thấp. Trước khi gửi email thương mại số lượng lớn cần chuyển sang dịch vụ email giao dịch và cấu hình tên miền gửi.

## 2. OpenStreetMap/Nominatim miễn phí

Dự án dùng bản đồ OpenStreetMap và máy chủ Nominatim công khai nên không cần API key, Cloud Billing hay thẻ thanh toán. `backend/.env` đã được chuẩn bị:

```env
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
NOMINATIM_EMAIL=namkz107@gmail.com
```

Để tuân thủ chính sách sử dụng công khai:

- frontend chỉ tìm khi người dùng bấm **Tìm địa chỉ**, không autocomplete trong lúc gõ;
- backend xếp hàng tối đa một request mỗi giây và cache kết quả 24 giờ;
- endpoint vị trí vẫn có rate limit 30 request/15 phút/IP;
- mọi bản đồ và kết quả đều ghi công OpenStreetMap;
- khi dự án có lưu lượng lớn, phải tự host Nominatim hoặc dùng một nhà cung cấp có SLA.

`NOMINATIM_EMAIL` là thông tin liên hệ của ứng dụng, không phải mật khẩu và không cấp quyền truy cập tài khoản Gmail.

## 3. Kiểm tra tích hợp

Từ thư mục gốc dự án chạy:

```powershell
npm run verify:integrations
```

Lệnh này gửi một email thử về `namkz107@gmail.com` và thực hiện một truy vấn Nominatim. Lệnh không in App Password ra màn hình. SMTP chỉ vượt qua sau khi bạn tự điền Gmail App Password vào `SMTP_PASS=`.
