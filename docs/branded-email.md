# Branded email của Cơ khí Đăng Khoa

Hệ thống gửi email HTML rộng tối đa 600px, CSS inline và luôn kèm bản plain-text. Các luồng đang dùng chung nhận diện gồm xác minh tài khoản, đặt lại mật khẩu, xác nhận đơn hàng và email từ trung tâm thông báo.

## Cấu hình thương hiệu

Thiết lập tại môi trường backend:

```env
EMAIL_FROM="Cơ khí Đăng Khoa <support@tencongty.vn>"
EMAIL_BRAND_NAME="Cơ khí Đăng Khoa"
SMTP_REQUIRE_TLS=true
EMAIL_DKIM_SELECTOR=google
QUOTE_ADMIN_EMAIL=baogia@tencongty.vn
COMPANY_NAME="CTY CPTV ĐẦU TƯ XD TM ĐĂNG KHOA"
COMPANY_PHONE=0983688326
COMPANY_PHONE_LABEL="098 3688326"
COMPANY_EMAIL=support@tencongty.vn
COMPANY_ADDRESS="Địa chỉ doanh nghiệp"
COMPANY_LOGO_URL=https://cdn.tencongty.vn/logo-email.png
COMPANY_ZALO_URL=https://zalo.me/0983688326
CLIENT_URL=https://tencongty.vn
```

Logo phải là URL HTTPS công khai; kích thước nguồn nên từ 224px trở lên, nền rõ và dung lượng nhỏ. Không dùng URL localhost hoặc ảnh cần đăng nhập.

## Khả năng gửi hợp lệ

Các bản ghi bên dưới phải được cấu hình tại DNS của tên miền gửi thư theo thông số của nhà cung cấp email:

- SPF: cho phép máy chủ SMTP được gửi thay mặt tên miền.
- DKIM: dùng khóa và selector do nhà cung cấp email cấp.
- DMARC: nên bắt đầu ở chế độ theo dõi `p=none`, kiểm tra báo cáo rồi tăng dần lên `quarantine` hoặc `reject`.
- Địa chỉ trong `EMAIL_FROM` nên cùng tên miền đã xác thực; `COMPANY_EMAIL` được dùng làm địa chỉ Reply-To.

Không dùng địa chỉ `@gmail.com` cá nhân làm `EMAIL_FROM` khi website chạy dưới tên miền doanh nghiệp. Với Google Workspace, hãy tạo hộp thư hoặc alias thật trên tên miền công ty, bật DKIM 2048-bit trong Admin Console và giữ miền trong `EMAIL_FROM` khớp với miền ký DKIM/SPF. Ứng dụng bắt buộc STARTTLS/TLS 1.2 trở lên và tạo `Message-ID` cùng miền với `EMAIL_FROM`, nhưng các thiết lập trong code không thể thay thế SPF, DKIM hoặc DMARC tại DNS.

### Checklist DNS chống vào spam

1. Chỉ có **một** TXT SPF tại tên miền gửi. Nếu chỉ gửi bằng Google Workspace, giá trị thường là `v=spf1 include:_spf.google.com ~all`; phải gộp thêm mọi nhà cung cấp gửi hợp lệ khác vào cùng bản ghi.
2. Bật DKIM bằng selector/khóa do nhà cung cấp email cấp; ưu tiên khóa 2048-bit. Không tự dùng chuỗi mẫu trong tài liệu này.
3. Tạo `_dmarc.tencongty.vn` ban đầu với chính sách theo dõi, ví dụ `v=DMARC1; p=none; rua=mailto:dmarc@tencongty.vn; adkim=r; aspf=r; pct=100`. Sau khi báo cáo cho thấy các nguồn hợp lệ đều pass/aligned, tăng dần lên `quarantine`, rồi `reject`.
4. Thêm miền gửi vào Google Postmaster Tools; theo dõi Authentication, Domain Reputation, Delivery Errors và giữ spam complaint dưới 0,1%, tuyệt đối không để chạm 0,3%.
5. Gửi thử tới Gmail/Outlook/Yahoo và mở “Show original/Xem bản gốc”; cả SPF, DKIM và DMARC phải `PASS`, miền `From` phải aligned.
6. Không dùng danh sách mua ngoài, không gửi marketing qua luồng transactional và không thêm `List-Unsubscribe` vào mail báo giá/đơn hàng do khách chủ động yêu cầu.

`QUOTE_ADMIN_EMAIL` là hộp thư vận hành bổ sung. Mọi tài khoản Staff/Admin đang hoạt động vẫn nhận bản riêng; hệ thống chống gửi trùng nếu hộp thư bổ sung trùng với một tài khoản đang hoạt động.

Không sao chép nguyên bản ghi mẫu từ nhà cung cấp khác. SPF chỉ nên có một bản ghi trên mỗi tên miền và phải gộp các nguồn gửi hợp lệ vào cùng bản ghi.

## Kiểm tra trước khi phát hành

Chạy `npm run verify:integrations` trong thư mục `backend`. Lệnh kiểm tra kết nối SMTP, bản ghi SPF/DMARC, DKIM theo `EMAIL_DKIM_SELECTOR`, gửi email HTML thử tới `SMTP_TEST_TO`, rồi in `messageId` và danh sách địa chỉ SMTP đã chấp nhận. “Accepted” chỉ xác nhận máy chủ nhận thư; vẫn phải kiểm tra Inbox/Spam và kết quả SPF/DKIM/DMARC trong header thư nhận được.

Kiểm tra email thử trên Gmail web/mobile và Outlook, gồm: logo, CTA, đường dẫn, nội dung plain-text, tên người gửi, Reply-To và thư mục spam. Không đưa token, mật khẩu ứng dụng SMTP hoặc khóa DKIM vào mã nguồn.
