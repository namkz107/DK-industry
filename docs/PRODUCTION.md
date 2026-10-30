# Checklist triển khai production

Tài liệu này phân biệt phần hệ thống đã kiểm soát trong mã nguồn với các dịch vụ cần doanh nghiệp cấu hình trước khi mở bán thật.

## Hạ tầng bắt buộc

- Dùng MongoDB replica set hoặc MongoDB Atlas. Các thao tác đơn hàng, tồn kho, giỏ hàng, báo giá và lệnh sản xuất dùng transaction; production sẽ từ chối khởi động nếu MongoDB không hỗ trợ transaction, trừ khi chủ động đặt `ALLOW_NON_TRANSACTIONAL_WRITES=true` (không khuyến nghị).
- Đặt `NODE_ENV=production`, `JWT_SECRET` đủ mạnh, `CLIENT_URL` đúng origin HTTPS và `TRUST_PROXY` phù hợp với reverse proxy thực tế.
- Không dùng tài khoản seed hoặc mật khẩu mẫu. Sau khi bootstrap Admin, xóa `ADMIN_SEED_PASSWORD` khỏi môi trường chạy.
- Bật HTTPS, backup MongoDB định kỳ, kiểm thử phục hồi backup, log tập trung, cảnh báo lỗi và giám sát endpoint `/api/health`. Backup phải được mã hóa bằng `age` theo [`BACKUP-ENCRYPTION.md`](BACKUP-ENCRYPTION.md); script restore kiểm tra hash ciphertext trước khi giải mã và khôi phục.
- Reverse proxy phải cho phép WebSocket upgrade tại đường dẫn `/socket.io`; cấu hình `VITE_SOCKET_URL` trỏ tới public origin của API realtime.
- Không publish origin trên `0.0.0.0` theo mặc định. Chọn `WEB_BIND_ADDRESS`
  trong `compose.production.env`: loopback cho proxy cùng máy hoặc private
  interface cho proxy từ xa. Firewall/VPS security group phải chỉ cho proxy
  được phép truy cập origin.
- Trên Cloudflare, bật proxy cho DNS record, dùng TLS Full (strict) với
  certificate hợp lệ tại origin, chặn truy cập origin ngoài dải IP được duyệt
  và kiểm thử HTTP/HTTPS/WebSocket từ bên ngoài. Đây là cấu hình hạ tầng, không
  được coi là hoàn tất chỉ vì repository có mẫu Compose.
- Đặt `TRUST_PROXY` theo số hop thực tế và xác minh `req.ip` bằng request qua
  chuỗi proxy. Cấu hình sai có thể làm rate limit gom mọi người dùng vào một IP
  hoặc tin địa chỉ giả mạo.
- Nếu chạy nhiều instance API, thêm Socket.IO Redis Streams Adapter, chuyển rate limit sang kho dùng chung và chỉ chạy tác vụ định kỳ trên một worker để tránh sự kiện hoặc giới hạn bị lệch giữa các node.

## Email, tệp và bản đồ

- Cấu hình SMTP để xác minh email, khôi phục mật khẩu và gửi thông báo nghiệp vụ. Đặt `SMTP_REQUIRE_TLS=true`, `QUOTE_ADMIN_EMAIL` là hộp thư vận hành thật và không dùng fallback hard-code. Thông báo nghiệp vụ có địa chỉ người nhận được giữ ở trạng thái `pending` ngay cả khi SMTP tạm mất, rồi thử lại tối đa `EMAIL_MAX_ATTEMPTS` lần; email trực tiếp thử lại tối đa `DIRECT_EMAIL_MAX_ATTEMPTS` lần và báo lỗi rõ thay vì giả vờ thành công.
- Trước go-live phải hoàn tất SPF, DKIM 2048-bit, DMARC có địa chỉ nhận báo cáo và Google Postmaster Tools theo [`branded-email.md`](branded-email.md). Kiểm tra thư thử có SPF/DKIM/DMARC `PASS` và aligned; SMTP `accepted` không đồng nghĩa thư chắc chắn vào Inbox.
- Bản đồ Google, điểm ghim và chỉ đường không cần API key. Tìm kiếm/đổi GPS thành địa chỉ dùng Nominatim công cộng; cấu hình `COMPANY_EMAIL` thật, giữ attribution OpenStreetMap và kiểm tra luồng nhập địa chỉ thủ công khi dịch vụ bên ngoài tạm lỗi.
- Compose mẫu có ClamAV private, quarantine logic và download gate theo `scanStatus`. Phải chạy EICAR/failure drill trên staging trước production. Môi trường nhiều API instance còn cần object storage chung, Socket.IO adapter/pub-sub cho thu hồi session và quy trình quarantine dùng chung; unit test scanner mock không thay thế integration test ClamAV thật.

## Thông tin doanh nghiệp và pháp lý

- Điền đầy đủ các biến `VITE_COMPANY_*`, đặc biệt tên pháp lý, mã số thuế/đăng ký và người đại diện. Không xuất bản nội dung placeholder.
- Nhờ đơn vị pháp lý rà soát điều khoản, quyền riêng tư, vận chuyển, thanh toán, đổi trả và bảo hành theo mô hình kinh doanh thực tế.
- Đào tạo người xử lý yêu cầu dữ liệu cá nhân theo [`PRIVACY-OPERATIONS.md`](PRIVACY-OPERATIONS.md) trước khi mở chức năng cho khách thật.
- Checkout bắt buộc khách đồng ý điều khoản và lưu thời điểm/phiên bản vào đơn hàng. Khi sửa nội dung chính sách, tăng đồng thời `TERMS_VERSION` (backend) và `VITE_POLICY_VERSION` (frontend) trước khi phát hành.
- Hoàn tất thủ tục thông báo/đăng ký website thương mại điện tử và quy trình hóa đơn điện tử theo yêu cầu áp dụng cho doanh nghiệp.

## Tích hợp phải chọn nhà cung cấp

Mã nguồn đã quản lý trạng thái thanh toán, số tiền, mã tham chiếu, hoàn tiền chờ xử lý, đơn vị vận chuyển và mã vận đơn. Để tự động hóa hoàn toàn, vẫn cần chọn và tích hợp:

- cổng thanh toán/webhook có xác thực chữ ký và cơ chế chống gửi lặp;
- hãng vận chuyển/API tính phí, tạo vận đơn và đồng bộ trạng thái;
- nhà cung cấp hóa đơn điện tử;
- object storage, quét malware và dịch vụ gửi email production.

Không đánh dấu thanh toán thành công từ callback phía trình duyệt. Chỉ ghi nhận sau webhook đã xác minh hoặc sau đối soát bởi nhân viên có thẩm quyền.

## Kiểm tra trước go-live

1. Chạy `npm test` trong `backend` với toàn bộ cờ integration được bật.
2. Chạy `npm run lint` và `npm run build` trong `frontend`.
3. Thử lại các luồng: đăng ký/xác minh/khôi phục mật khẩu; tư vấn → chuyển đổi yêu cầu; báo giá → chấp nhận → lệnh sản xuất; đặt hàng → thanh toán → giao → hậu mãi; hủy và hoàn tiền.
4. Kiểm tra phân quyền bằng ít nhất bốn tài khoản: khách, hai nhân viên khác nhau và quản trị viên.
5. Thử webhook trùng, đặt hàng nhấn hai lần, thiếu tồn kho, email lỗi, upload sai định dạng, MongoDB mất kết nối và khôi phục backup.
6. Tắt SMTP tạm thời, tạo một notification nghiệp vụ, bật lại SMTP và xác nhận hàng đợi gửi bù; kiểm tra không có người nhận trùng giữa Staff/Admin, `QUOTE_ADMIN_EMAIL` và `COMPANY_EMAIL`.
