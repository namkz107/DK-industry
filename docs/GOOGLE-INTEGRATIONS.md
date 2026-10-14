# Gmail SMTP và bản đồ miễn phí

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

## 2. Google Maps và tìm kiếm địa chỉ miễn phí

Trang Liên hệ hiển thị Google Maps qua URL nhúng, còn nút mở vị trí/chỉ đường dùng Maps URLs. Các luồng này không cần API key hoặc tài khoản billing.

Tìm kiếm địa chỉ và nút **Vị trí của tôi** dùng Nominatim/OpenStreetMap. Backend gửi yêu cầu với User-Agent nhận diện bằng `COMPANY_EMAIL`, cache kết quả 24 giờ và xếp hàng tối đa một yêu cầu mỗi giây. Frontend chỉ tìm khi người dùng bấm **Tìm**, luôn cho phép sửa địa chỉ thủ công và có nút kiểm tra điểm ghim bằng Google Maps.

Website phải giữ dòng ghi nhận `© OpenStreetMap contributors`. Chính sách quyền riêng tư phải nêu rằng truy vấn/tọa độ được gửi tới Nominatim khi tìm kiếm hoặc đổi GPS thành địa chỉ, và được gửi tới Google khi người dùng tải bản đồ hoặc mở chỉ đường.

## 3. Kiểm tra tích hợp

Từ thư mục gốc dự án chạy:

```powershell
npm run verify:integrations
```

Lệnh này gửi một email thử về địa chỉ đặt tại `SMTP_TEST_TO` (hoặc `SMTP_USER`) và thử tìm địa chỉ qua Nominatim. Lệnh không in App Password ra màn hình. SMTP chỉ vượt qua sau khi bạn tự điền Gmail App Password vào `SMTP_PASS=`.
