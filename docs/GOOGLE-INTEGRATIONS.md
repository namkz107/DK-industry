# Gmail SMTP và Google Maps Platform

## 1. Gmail SMTP miễn phí cho môi trường hiện tại

Tài khoản gửi: dùng địa chỉ SMTP do doanh nghiệp quản lý. Không ghi địa chỉ email cá nhân vào tài liệu hoặc mã nguồn.

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
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=
EMAIL_FROM="DK Industry <your_gmail_address@gmail.com>"
SMTP_TEST_TO=your_gmail_address@gmail.com
```

Gmail cá nhân phù hợp cho phát triển và lượng email thấp. Trước khi gửi email thương mại số lượng lớn cần chuyển sang dịch vụ email giao dịch và cấu hình tên miền gửi.

## 2. Google Maps Platform

Trang Liên hệ hiển thị Google Maps bằng Maps Embed API. Tạo browser API key, chỉ bật **Maps Embed API**, giới hạn key theo domain website rồi cấu hình frontend:

```env
VITE_GOOGLE_MAPS_EMBED_API_KEY=your_restricted_google_maps_embed_api_key
```

API key frontend là giá trị công khai trong bundle nên việc giới hạn theo HTTP referrer và theo API là bắt buộc. Liên kết mở vị trí/chỉ đường cũng sử dụng Google Maps và không cần key.

Tìm kiếm địa chỉ giao hàng dùng Places API (New), lấy tọa độ của gợi ý đã chọn dùng Place Details (New), còn nút **Vị trí của tôi** dùng Geocoding API để đổi GPS thành địa chỉ. Tạo một server key riêng và cấu hình `backend/.env`:

```env
GOOGLE_MAPS_SERVER_API_KEY=your_google_maps_server_api_key
```

Giới hạn server key:

- API restrictions: chỉ **Places API (New)** và **Geocoding API**;
- Application restrictions production: IP public cố định của backend;
- không đưa server key vào biến `VITE_*`, frontend hoặc repository;
- dùng session token riêng cho mỗi lượt tìm rồi truyền lại khi lấy Place Details;
- giữ quota và billing alert phù hợp với lưu lượng dự kiến.

Frontend hiển thị attribution Google Maps cạnh kết quả Places. Website phải duy trì Điều khoản sử dụng và Chính sách quyền riêng tư công khai có dẫn chiếu đến điều khoản và chính sách của Google.

## 3. Kiểm tra tích hợp

Từ thư mục gốc dự án chạy:

```powershell
npm run verify:integrations
```

Lệnh này gửi một email thử về địa chỉ đặt tại `SMTP_TEST_TO` (hoặc `SMTP_USER`), gọi Places Autocomplete và Place Details. Lệnh không in App Password hoặc Google API key ra màn hình. SMTP chỉ vượt qua sau khi bạn tự điền Gmail App Password vào `SMTP_PASS=`.
