# Vận hành yêu cầu dữ liệu cá nhân

Tài liệu này là quy trình nội bộ cho tính năng **Dữ liệu và quyền riêng tư**. Đây không thay thế ý kiến tư vấn pháp lý; người phụ trách phải đối chiếu chính sách đã công bố và nghĩa vụ lưu trữ áp dụng tại thời điểm xử lý.

## Kênh tiếp nhận

- Khách hàng đã xác minh email có thể tải bản sao dữ liệu tại **Tài khoản**.
- Khách hàng có thể gửi hoặc hủy yêu cầu xóa tài khoản tại cùng màn hình.
- Admin xem và xử lý tại **Quản trị → Quyền riêng tư**. Mọi thay đổi đều ghi audit log và tạo thông báo cho khách hàng.

## Phân loại dữ liệu

- Có thể xem xét xóa/ẩn: hồ sơ tài khoản, địa chỉ đã lưu, giỏ hàng, phiên đăng nhập, cuộc hội thoại hỗ trợ không còn cần thiết và thông tin tiếp thị.
- Không được tự ý xóa: đơn hàng, báo giá, hợp đồng, thông tin thanh toán, đối soát, chứng từ thuế/kế toán, hồ sơ bảo hành hoặc dữ liệu đang liên quan đến tranh chấp. Xác định thời hạn lưu giữ trước khi thực hiện.
- Bản vẽ/tệp kỹ thuật: xác định chủ sở hữu, điều khoản hợp đồng và thời hạn cần lưu trước khi xóa khỏi object storage.

## Quy trình xử lý

1. Xác nhận người yêu cầu là chủ tài khoản qua phiên đăng nhập và email đã xác minh.
2. Chuyển trạng thái từ `Đã tiếp nhận` sang `Đang xem xét`.
3. Kiểm tra đơn hàng, báo giá, công việc sản xuất, thanh toán, bảo hành và tranh chấp còn mở.
4. Ghi rõ dữ liệu nào sẽ xóa/ẩn, dữ liệu nào giữ lại, căn cứ và thời hạn dự kiến vào ô **Kết quả/Ghi chú xử lý**.
5. Nếu không thể xóa ngay, ghi rõ lý do và chuyển `Từ chối` hoặc giữ `Đang xem xét` theo chính sách.
6. Chỉ chuyển `Đã hoàn tất` sau khi thao tác thực tế đã được kiểm tra bởi người phụ trách. Không dùng trạng thái này như một cam kết rằng mọi chứng từ đã bị xóa.

## Kiểm tra trước khi hoàn tất

- Không còn phiên đăng nhập nào cần thu hồi.
- Không còn dữ liệu marketing/tệp không bắt buộc trong kho lưu trữ.
- Các dữ liệu giữ lại có danh sách và lý do rõ ràng.
- Khách hàng nhận thông báo kết quả; nhật ký admin thể hiện người xử lý và thời gian xử lý.

## Bảo mật

- Không gửi bản sao dữ liệu qua email công khai. Khách tự tải sau khi đăng nhập và xác minh email.
- Không đưa mật khẩu hash, refresh token, API key, khóa tệp nội bộ hoặc ghi chú nhân viên vào gói xuất dữ liệu.
- Chỉ Admin được xử lý yêu cầu. Nếu cần người phê duyệt thứ hai, áp dụng quy trình nội bộ trước khi chuyển trạng thái cuối cùng.
