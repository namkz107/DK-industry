# Authentication — DK Industry

## Phạm vi đã triển khai

Hệ thống dùng ba role cố định:

| Role | Cách tạo | Quyền hiện tại |
|---|---|---|
| `customer` | Tự đăng ký trên website | Quản lý hồ sơ, địa chỉ, giỏ hàng, đơn hàng, yêu cầu gia công và hội thoại riêng |
| `staff` | Do Admin cấp | Xem hàng chờ chưa giao; sau khi nhận chỉ xử lý lead, yêu cầu, báo giá, lệnh sản xuất, đơn hàng và hỗ trợ được giao cho mình |
| `admin` | Bootstrap bằng seed hoặc tạo từ trang Admin | Toàn quyền nghiệp vụ, tài khoản, nội dung và nhật ký kiểm toán sau khi hoàn tất MFA |

API đăng ký không đọc trường `role` từ client. Vì vậy người dùng công khai không thể tự đăng ký thành Staff/Admin.

## Cơ chế phiên đăng nhập

1. Đăng nhập/đăng ký đúng sẽ trả access token có hạn 15 phút. Frontend chỉ giữ token trong bộ nhớ, không ghi vào `localStorage`.
2. Backend đồng thời tạo refresh token ngẫu nhiên, gửi bằng session cookie `HttpOnly`, `SameSite=Lax`; cookie không có `Max-Age` lưu dài hạn.
3. MongoDB chỉ lưu SHA-256 hash của refresh token và CSRF token trong collection `refreshsessions`, không lưu token gốc. Frontend giữ CSRF token trong `sessionStorage` và gửi header `X-CSRF-Token` khi refresh/đăng xuất, bảo vệ cả cấu hình cross-site `SameSite=None`.
4. Trong cùng một tab, tải lại trang vẫn giữ phiên để tránh bắt đăng nhập lại không cần thiết. Khi đóng tab/trình duyệt, dấu phiên phía frontend mất; lần mở sau cookie cũ được thu hồi và người dùng phải đăng nhập lại. Khi access token hết hạn trong lúc sử dụng, frontend gọi `/api/auth/refresh` và xoay token cũ.
5. Đăng xuất thu hồi session hiện tại và ngắt mọi Socket.IO đang gắn với session đó trong instance API hiện tại. Đổi mật khẩu tăng `tokenVersion`, thu hồi toàn bộ refresh session và ngắt các socket đã đăng ký. Khi chạy nhiều API instance phải bổ sung Socket.IO adapter/pub-sub chung để truyền sự kiện thu hồi giữa các node.

6. Mỗi request được bảo vệ đều kiểm tra tài khoản còn tồn tại, đang `active` và đúng `tokenVersion`. `/api/admin` còn yêu cầu session hiện tại có `mfaVerifiedAt`.

## Tạo Admin đầu tiên

Trong PowerShell, tại thư mục dự án:

```powershell
Copy-Item backend\.env.example backend\.env
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Dán chuỗi vừa sinh vào `JWT_SECRET`, sau đó sửa các giá trị sau trong `backend/.env`:

```dotenv
ADMIN_SEED_NAME=Họ tên quản trị viên
ADMIN_SEED_EMAIL=email-thật-của-bạn@example.com
ADMIN_SEED_PHONE=09xxxxxxxx
ADMIN_SEED_PASSWORD=<mat-khau-rieng-du-dai-va-khong-dung-lai>
```

Chạy:

```powershell
npm run seed:admin
npm start
```

Khi terminal báo `Admin account: ready`, đăng nhập tại `http://localhost:3000/dang-nhap`. Admin chưa bật MFA chỉ được dùng trang tài khoản và các endpoint thiết lập MFA; mọi endpoint `/api/admin` trả `MFA_ENROLLMENT_REQUIRED`. Sau khi xác nhận TOTP, session thiết lập được đánh dấu đã xác minh và các phiên khác bị thu hồi. Lệnh bootstrap không seed lại hoặc xóa sản phẩm/dự án. Không đưa mật khẩu thật vào `.env.example`, README, ảnh chụp hoặc Git. Xóa dòng mật khẩu khỏi `backend/.env` sau khi bootstrap xong; việc này không xóa mật khẩu đã hash trong MongoDB.

## Collection MongoDB

- `users`: hồ sơ, role, trạng thái và bcrypt hash của mật khẩu. Các trường `passwordHash` và `tokenVersion` bị ẩn khỏi query mặc định.
- `refreshsessions`: hash refresh/CSRF token, hạn dùng, thời điểm thu hồi, trạng thái MFA của session, user-agent và IP. TTL index tự dọn session hết hạn.

Có thể xem cả hai collection bằng MongoDB Compass và MongoDB Atlas. Không sửa `passwordHash`, `tokenVersion` hoặc `tokenHash` thủ công trừ khi đang phục hồi hệ thống có kiểm soát.

## Checklist trước production

- Đặt `NODE_ENV=production`, dùng HTTPS và một `JWT_SECRET` riêng có độ ngẫu nhiên cao.
- Đặt `CLIENT_URL` đúng origin frontend; nhiều origin phải phân tách bằng dấu phẩy.
- Không commit bất kỳ file `.env` nào và bật secret scanning trên repository public.
- Không ghi access/refresh token, mật khẩu hoặc toàn bộ header cookie vào log.
- Link reset/xác minh mới chỉ nhận token trong URL fragment rồi gửi bằng POST body. Query `?token=` cũ không còn được chấp nhận; Nginx mẫu bỏ query string và Referer khỏi access log.
- Luồng quên mật khẩu, xác minh email và gửi lại liên kết xác minh đã có.
- Admin bắt buộc MFA TOTP tương thích Google Authenticator/Microsoft Authenticator. Secret được mã hóa AES-256-GCM bằng `MFA_ENCRYPTION_KEY`; mười mã khôi phục chỉ lưu dạng hash và mỗi mã chỉ dùng một lần.
- Khi bật/tắt MFA, mọi phiên khác của Admin bị thu hồi. Đăng nhập Admin đã bật MFA cần hoàn tất challenge 5 phút trước khi được tạo session.
- Trước khi thiết lập MFA lần đầu, chạy `npm run setup:mfa-key`. Script ghi khóa ngẫu nhiên riêng vào `backend/.env` mà không in khóa ra màn hình; phải sao lưu khóa này trong secret manager khi deploy.
- Customer phải xác minh email trước khi đặt hàng hoặc gửi yêu cầu/bản vẽ kỹ thuật. Các thao tác cần bảo vệ quyền lợi như hủy đơn và hậu mãi không bị chặn chỉ vì trạng thái xác minh.
- Trang tài khoản liệt kê tối đa 20 phiên đang hoạt động, cho phép thu hồi từng phiên hoặc đăng xuất toàn bộ thiết bị. Đăng xuất toàn bộ tăng `tokenVersion` và thu hồi mọi refresh session.
- Quên mật khẩu và gửi lại email xác minh dùng giới hạn riêng 5 yêu cầu/giờ/IP để tránh lạm dụng hộp thư.
- Khi frontend và API nằm khác site, cấu hình cookie `SameSite=None; Secure`; CSRF token đã được áp dụng cho refresh/đăng xuất và frontend phải giữ `VITE_API_URL` đúng origin API.
