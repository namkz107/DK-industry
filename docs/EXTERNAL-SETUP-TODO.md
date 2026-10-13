# Việc bên ngoài cần hoàn tất trước khi mở bán

Tài liệu này dành cho các thao tác không thể thay bằng mã nguồn: cần quyền trên máy, MongoDB Atlas hoặc thông tin doanh nghiệp thật. Không dán mật khẩu, connection string, API secret hoặc mã MFA vào chat hay Git.

## 1. Sao lưu Atlas và thử khôi phục

1. Giải nén MongoDB Database Tools đã tải về.
2. Mở PowerShell trong thư mục `bin` và kiểm tra:

   ```powershell
   .\mongodump.exe --version
   ```

3. Ở thư mục dự án, chạy:

   ```powershell
   npm run backup:db
   ```

4. Giữ riêng tệp `.archive.gz` và tệp `.sha256` được tạo trong `backups/`; thư mục này đã bị Git bỏ qua.
5. Chỉ khi đã có database khôi phục riêng, thử restore một bản sao theo [PRE-DEPLOY-CHECKLIST.md](PRE-DEPLOY-CHECKLIST.md). Script yêu cầu ánh xạ rõ database nguồn và đích, đồng thời từ chối đích không kết thúc bằng `_test` hoặc `-test` mặc định. Tuyệt đối không restore đè `dk_industry` đang vận hành.

## 2. Database Atlas dành riêng cho kiểm thử

Việc này chưa bắt buộc để chạy website, nhưng bắt buộc trước khi kết luận các luồng tự động đã được kiểm thử đầy đủ.

1. Trong Atlas, dùng cùng cluster và tạo database riêng tên `dk_industry_test` (database sẽ xuất hiện khi test ghi dữ liệu lần đầu).
2. Đảm bảo database user của ứng dụng có quyền `readWrite` với database này.
3. Thêm **một dòng mới** vào `backend/.env`; không thay dòng `MONGODB_URI` đang dùng:

   ```env
   TEST_MONGODB_URI=mongodb+srv://.../dk_industry_test?retryWrites=true&w=majority
   ```

4. Khi muốn chạy bộ integration test Atlas, bật các cờ `RUN_*_INTEGRATION=1` theo [PRE-DEPLOY-CHECKLIST.md](PRE-DEPLOY-CHECKLIST.md). Bộ test sẽ từ chối database không kết thúc bằng `_test` hoặc `-test`.

## 3. Xác nhận dịch vụ đã cấu hình

- Chạy `npm run verify:integrations` để gửi một email kiểm tra và thử tìm địa chỉ bằng OpenStreetMap.
- Kiểm tra một tệp bản vẽ/PDF đã upload có thể tải xuống lại sau khi mở lại yêu cầu.
- Trong Atlas, chỉ giữ IP access list thực sự cần thiết và dùng database user riêng của ứng dụng, không dùng tài khoản Atlas cá nhân.
- Lưu recovery codes của MFA Admin vào nơi quản lý mật khẩu an toàn, không lưu trong source code hoặc ảnh chụp màn hình.

## 4. Dữ liệu và quyết định kinh doanh phải có trước go-live

- Điền thông tin pháp lý thật vào `VITE_COMPANY_*`: mã số thuế/đăng ký, người đại diện và thông tin liên hệ đã được phê duyệt.
- Có chính sách đã được rà soát cho thanh toán, giao hàng, đổi trả, bảo hành và quyền riêng tư.
- Chọn nhà cung cấp cho thanh toán trực tuyến, vận chuyển và hóa đơn điện tử nếu muốn tự động hóa; hiện tại hệ thống vận hành an toàn với COD/chuyển khoản được nhân sự đối soát.
- Tạo ít nhất bốn tài khoản thử: một Admin, hai Staff và một Customer; chạy lại toàn bộ luồng nghiệp vụ trong [PRODUCTION.md](PRODUCTION.md).

## 5. Chỉ thực hiện khi chuẩn bị deploy

Lúc đó mới đặt domain/hosting, HTTPS, `CLIENT_URL`, `VITE_API_URL`, `VITE_SOCKET_URL`, SMTP production, lịch backup và cảnh báo lỗi tập trung. Xem [PRODUCTION.md](PRODUCTION.md) để có danh sách đầy đủ.
