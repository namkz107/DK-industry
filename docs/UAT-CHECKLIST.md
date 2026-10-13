# Checklist nghiệm thu người dùng trước mở bán

Chuẩn bị bốn tài khoản: một Customer, hai Staff và một Admin. Thực hiện trên staging gần giống production, bằng cả máy tính và điện thoại thật.

## Website công khai

- [ ] Trang chủ, giới thiệu, dịch vụ, dự án, sản phẩm và liên hệ tải không lỗi.
- [ ] Menu, footer, nút gọi điện/email và bản đồ hoạt động trên mobile.
- [ ] Nội dung, ảnh, giá, tồn kho và thông tin liên hệ là dữ liệu đã duyệt.
- [ ] Form tư vấn tạo đúng một lead khi người dùng bấm hai lần.
- [ ] Trang không tồn tại hiển thị thông báo phù hợp.
- [ ] Canonical, robots và sitemap dùng domain thật.

## Tài khoản và bảo mật

- [ ] Đăng ký, email xác minh, đăng nhập và đăng xuất hoạt động.
- [ ] Quên mật khẩu gửi email và token chỉ dùng được một lần.
- [ ] Customer không mở được route Staff/Admin; Staff không mở được route chỉ Admin.
- [ ] Thu hồi một phiên và thu hồi tất cả phiên có hiệu lực ngay.
- [ ] Admin bật MFA, đăng nhập bằng TOTP và thử một recovery code.
- [ ] Tài khoản bị khóa không thể tiếp tục dùng access/refresh session.

## Customer và đơn hàng

- [ ] Thêm/sửa/xóa địa chỉ, tìm địa chỉ và lấy vị trí GPS.
- [ ] Thêm sản phẩm, sửa số lượng, xóa khỏi giỏ và thử vượt tồn kho.
- [ ] Tạo đơn COD và chuyển khoản; nhấn nút đặt hàng hai lần không tạo hai đơn.
- [ ] Customer chỉ hủy được đơn ở trạng thái cho phép.
- [ ] Staff xác nhận tồn kho, thanh toán, giao hàng và mã vận đơn đúng thứ tự.
- [ ] Tạo yêu cầu đổi trả/bảo hành/khiếu nại và hoàn tất xử lý.

## Báo giá và sản xuất

- [ ] Customer tạo yêu cầu có PDF/ảnh và một tệp kỹ thuật hợp lệ.
- [ ] Tệp sai loại, sai chữ ký hoặc vượt kích thước bị từ chối.
- [ ] Hai Staff không ghi đè hồ sơ của nhau ngoài quy trình cho phép.
- [ ] Staff trao đổi với Customer; ghi chú nội bộ không hiển thị cho Customer.
- [ ] Báo giá nháp không hiển thị cho Customer; bản đã gửi có đúng VAT/tổng tiền.
- [ ] Customer yêu cầu sửa báo giá rồi chấp thuận phiên bản mới.
- [ ] Chấp thuận báo giá tạo lệnh sản xuất và cập nhật tiến độ đúng thứ tự.

## Realtime, email và AI

- [ ] Tin nhắn realtime hoạt động sau khi mất mạng và kết nối lại.
- [ ] Gửi lặp cùng `clientMessageId` không tạo bản ghi trùng.
- [ ] Email xác minh, khôi phục và thông báo nghiệp vụ tới hộp thư thật.
- [ ] Email lỗi được retry và cuối cùng hiển thị để nhân sự xử lý thủ công.
- [ ] AI không tiết lộ secret/nội dung nội bộ và chuyển Staff khi không chắc chắn.

## Admin, quyền riêng tư và vận hành

- [ ] Admin tạo Staff, khóa/mở tài khoản và xem audit log.
- [ ] CRUD sản phẩm/dịch vụ/dự án, upload và xóa ảnh Cloudinary hoạt động.
- [ ] Customer tải bản sao dữ liệu và gửi/hủy yêu cầu xóa tài khoản.
- [ ] Admin xử lý yêu cầu xóa theo runbook, giữ dữ liệu bắt buộc theo pháp luật.
- [ ] `/api/ready` báo lỗi khi database mất kết nối và hồi phục sau khi kết nối lại.
- [ ] Backup mới có checksum đúng và restore thành công vào database `_test`.
- [ ] `npm run smoke:production -- https://domain` đạt toàn bộ bước.

## Ký nghiệm thu

Ghi ngày, release SHA, người kiểm tra, thiết bị/trình duyệt, lỗi còn chấp nhận được và người phê duyệt. Không mở bán nếu còn lỗi phân quyền, mất dữ liệu, sai tổng tiền, lộ tệp riêng tư hoặc không thể restore backup.
