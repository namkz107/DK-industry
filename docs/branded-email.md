# Branded email của Cơ khí Đăng Khoa

Hệ thống gửi email HTML rộng tối đa 600px, CSS inline và luôn kèm bản plain-text. Các luồng đang dùng chung nhận diện gồm xác minh tài khoản, đặt lại mật khẩu, xác nhận đơn hàng và email từ trung tâm thông báo.

## Cấu hình thương hiệu

Thiết lập tại môi trường backend:

```env
EMAIL_FROM="Cơ khí Đăng Khoa <support@tencongty.vn>"
EMAIL_BRAND_NAME="Cơ khí Đăng Khoa"
COMPANY_NAME="CTY CPTV ĐẦU TƯ XD TM ĐĂNG KHOA"
COMPANY_PHONE=0983688336
COMPANY_PHONE_LABEL="098 368 8336"
COMPANY_EMAIL=support@tencongty.vn
COMPANY_ADDRESS="Địa chỉ doanh nghiệp"
COMPANY_LOGO_URL=https://cdn.tencongty.vn/logo-email.png
COMPANY_ZALO_URL=https://zalo.me/...
CLIENT_URL=https://tencongty.vn
```

Logo phải là URL HTTPS công khai; kích thước nguồn nên từ 224px trở lên, nền rõ và dung lượng nhỏ. Không dùng URL localhost hoặc ảnh cần đăng nhập.

## Khả năng gửi hợp lệ

Các bản ghi bên dưới phải được cấu hình tại DNS của tên miền gửi thư theo thông số của nhà cung cấp email:

- SPF: cho phép máy chủ SMTP được gửi thay mặt tên miền.
- DKIM: dùng khóa và selector do nhà cung cấp email cấp.
- DMARC: nên bắt đầu ở chế độ theo dõi `p=none`, kiểm tra báo cáo rồi tăng dần lên `quarantine` hoặc `reject`.
- Địa chỉ trong `EMAIL_FROM` nên cùng tên miền đã xác thực; `COMPANY_EMAIL` được dùng làm địa chỉ Reply-To.

Không sao chép nguyên bản ghi mẫu từ nhà cung cấp khác. SPF chỉ nên có một bản ghi trên mỗi tên miền và phải gộp các nguồn gửi hợp lệ vào cùng bản ghi.

## Kiểm tra trước khi phát hành

Chạy `npm run verify:integrations` trong thư mục `backend`. Lệnh sẽ kiểm tra SMTP và gửi một email HTML thử tới `SMTP_TEST_TO`.

Kiểm tra email thử trên Gmail web/mobile và Outlook, gồm: logo, CTA, đường dẫn, nội dung plain-text, tên người gửi, Reply-To và thư mục spam. Không đưa token, mật khẩu ứng dụng SMTP hoặc khóa DKIM vào mã nguồn.
