# DK Industry

Website giới thiệu năng lực, dự án và sản phẩm dành cho doanh nghiệp cơ khí – công nghiệp. Source được tổ chức theo mô hình React/Vite SPA + Node/Express REST API + MongoDB.

## Chức năng hiện có

- Landing page hiện đại, responsive: năng lực, dịch vụ, dự án, sản phẩm, quy trình và góc kỹ thuật.
- Form yêu cầu tư vấn/RFQ có thể đính kèm các sản phẩm đã chọn.
- API lưu và quản lý lead theo pipeline: mới, đã liên hệ, đã báo giá, thắng hoặc mất.
- CRUD API cho dự án và sản phẩm; thống kê CRM mini cho dashboard.
- Danh mục dịch vụ cơ khí thực tế: laser CNC, chấn gấp, gia công chính xác, Jig, hàn và hệ thống công nghiệp.
- Rate limiting và kiểm tra khóa nguy hiểm để hạn chế spam form/MongoDB injection.
- Script seed MongoDB để tạo dữ liệu phát triển; giao diện production không tự thay dữ liệu thật bằng dữ liệu demo khi API lỗi.
- Authentication cho Customer, Staff và Admin bằng access token ngắn hạn + refresh cookie HttpOnly.
- Phân quyền API: Staff xử lý dashboard/lead; chỉ Admin được thay đổi hoặc xóa nội dung hệ thống.
- Trung tâm Customer: hồ sơ, tối đa 5 địa chỉ, giỏ hàng MongoDB, đặt/hủy đơn, lịch sử trạng thái và yêu cầu gia công kèm bản vẽ riêng tư.

## Frontend stack chuẩn của dự án

- **Vite + React + TypeScript**: build nhanh, type-safe và hỗ trợ code splitting.
- **Tailwind CSS v4**: design system, responsive và CSS production tối ưu.
- **shadcn/ui + Radix UI**: component source-owned, accessible, dễ tùy biến.
- **TanStack Query**: gọi API, cache, deduplicate và quản lý trạng thái server.
- **React Hook Form + Zod**: form hiệu năng cao và validation thống nhất.
- **React Router**: lazy route cho trang dịch vụ, dự án và sản phẩm.
- **Lucide React**: icon vector tree-shakeable.
- **React Bits**: animation source-owned, có hỗ trợ reduced motion.

Mọi chức năng frontend mới cần tiếp tục dùng stack này và ưu tiên chữ dễ đọc, vùng bấm tối thiểu 44px, tương phản cao, thao tác ngắn và hỗ trợ bàn phím.

## Cấu trúc

```text
dk-industry/
├── frontend/               # React/Vite + TypeScript
│   ├── public/
│   ├── src/components/ui/        # shadcn primitives
│   ├── src/components/react-bits/# animation source-owned
│   ├── src/pages/                # lazy-loaded routes
│   └── src/lib/                  # API và utilities
├── backend/                # Express/Mongoose API
│   ├── src/config/
│   ├── src/middleware/
│   ├── src/models/
│   └── src/routes/
└── package.json            # script điều phối monorepo
```

## Chạy local

Yêu cầu Node.js 20.19+ và MongoDB local (hoặc MongoDB Atlas).

```bash
npm run install:all
Copy-Item backend\.env.example backend\.env
npm run seed
npm start
```

- Website: `http://localhost:3000`
- API health check: `http://localhost:5000/api/health`

Mở `backend/.env`, thay `JWT_SECRET` bằng chuỗi ngẫu nhiên dài và đặt `ADMIN_SEED_*` bằng thông tin riêng. Chạy `npm run seed:admin` để chỉ tạo/cập nhật Admin mà không xóa sản phẩm hoặc dự án hiện có. Không commit `backend/.env`; file này đã được `.gitignore` loại trừ. Sau khi tạo Admin thành công, có thể xóa giá trị `ADMIN_SEED_PASSWORD` khỏi máy để tránh đặt lại mật khẩu ngoài ý muốn.

Đăng ký công khai luôn tạo role `customer`, kể cả khi request cố gửi `role: admin`. Tài khoản Staff/Admin chỉ được cấp bởi Admin hoặc script bootstrap đáng tin cậy.

Frontend hiển thị đúng trạng thái trống hoặc lỗi khi MongoDB/backend chưa hoạt động, tránh khiến người dùng nhầm dữ liệu demo là dữ liệu thật. Chạy `npm run seed` khi cần dữ liệu phát triển.

### Cấu hình bản đồ và định vị

Bản đồ ở trang `/lien-he` dùng **Google Maps Embed API**. Cấu hình browser key đã giới hạn theo domain và chỉ được phép gọi Maps Embed API trong `frontend/.env`:

```env
VITE_GOOGLE_MAPS_EMBED_API_KEY=your_restricted_google_maps_embed_api_key
```

Tính năng tìm địa chỉ dùng **Places API (New)**, lấy tọa độ sau khi chọn bằng **Place Details (New)** và đổi GPS thành địa chỉ bằng **Geocoding API**. Server key chỉ nằm trong `backend/.env`:

```env
GOOGLE_MAPS_SERVER_API_KEY=your_google_maps_server_api_key
```

Bản đồ Google chỉ tải sau khi người dùng bấm xem. Mỗi lượt tìm địa chỉ tạo một session token riêng; khi khách chọn gợi ý, backend kết thúc session bằng Place Details và chỉ yêu cầu các trường địa chỉ/tọa độ cần thiết. Key backend phải giới hạn cho Places API (New), Geocoding API và IP máy chủ; key frontend phải giới hạn cho Maps Embed API và domain website.

## API chính

| Method | Endpoint | Công dụng |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản Customer |
| POST | `/api/auth/login` | Đăng nhập bằng email hoặc số điện thoại |
| POST | `/api/auth/refresh` | Xoay refresh token và cấp access token mới |
| POST | `/api/auth/logout` | Thu hồi phiên đăng nhập hiện tại |
| GET | `/api/auth/me` | Xem tài khoản đang đăng nhập |
| POST | `/api/auth/change-password` | Đổi mật khẩu và thu hồi toàn bộ phiên |
| GET/PATCH | `/api/customer/profile` | Xem/cập nhật hồ sơ Customer |
| POST/PATCH/DELETE | `/api/customer/addresses/:id` | Quản lý địa chỉ giao hàng |
| GET/POST | `/api/customer/locations/*` | Tìm địa chỉ, lấy chi tiết và reverse-geocode GPS |
| GET/POST/PATCH/DELETE | `/api/customer/cart/*` | Quản lý giỏ hàng theo tài khoản |
| GET/POST | `/api/customer/orders` | Xem/tạo đơn hàng thương mại |
| GET/POST | `/api/customer/requests` | Xem/gửi yêu cầu gia công và báo giá |
| GET | `/api/projects` | Danh sách dự án đã xuất bản |
| GET | `/api/products` | Danh sách sản phẩm đang hoạt động |
| GET | `/api/services` | Danh mục dịch vụ đã xuất bản |
| POST | `/api/leads` | Gửi yêu cầu tư vấn / báo giá |
| GET | `/api/admin/dashboard` | Thống kê CRM mini |
| GET/PATCH | `/api/admin/leads` | Danh sách/cập nhật trạng thái lead |
| GET | `/api/staff/dashboard` | Công việc tổng quan của Staff |
| GET/PATCH | `/api/staff/leads/:id` | Tiếp nhận và xử lý Lead có audit trail |
| GET/PATCH | `/api/staff/requests/:id` | Xử lý yêu cầu kỹ thuật và phân công |
| POST | `/api/staff/requests/:id/messages` | Trao đổi với khách hoặc ghi chú nội bộ |
| POST | `/api/staff/requests/:id/quotations` | Lưu nháp hoặc phát hành báo giá có phiên bản |
| GET/PATCH | `/api/staff/orders/:id` | Xác nhận tồn kho, thanh toán và giao hàng |
| POST/PATCH/DELETE | `/api/admin/products/:id` | Quản trị sản phẩm |
| POST/PATCH/DELETE | `/api/admin/projects/:id` | Quản trị dự án |

Các route `/api/staff/*` dành cho Staff/Admin xử lý nghiệp vụ. Route quản trị nội dung `/api/admin/products|projects|services` tiếp tục yêu cầu role Admin. Trước khi production cần thay toàn bộ thông tin liên hệ, hình ảnh demo và cấu hình email/Zalo/thanh toán thực tế.

Quy chuẩn kiểm duyệt nội dung và phòng tránh SEO spam nằm tại [`docs/CONTENT-SECURITY.md`](docs/CONTENT-SECURITY.md).
Kiến trúc, luồng sử dụng và checklist production của Authentication nằm tại [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md).
Nghiệp vụ Customer, trạng thái và kịch bản kiểm tra nằm tại [`docs/CUSTOMER.md`](docs/CUSTOMER.md).
Luồng Lead và Service Request nằm tại [`docs/LEAD-SERVICE-REQUEST.md`](docs/LEAD-SERVICE-REQUEST.md).
Quyền hạn, workflow và kịch bản kiểm tra Staff nằm tại [`docs/STAFF.md`](docs/STAFF.md).
Checklist cấu hình, vận hành và các tích hợp ngoài hệ thống trước khi go-live nằm tại [`docs/PRODUCTION.md`](docs/PRODUCTION.md).
Trạng thái nghiệm thu code, backup/restore và các thông tin doanh nghiệp còn phải cung cấp nằm tại [`docs/PRE-DEPLOY-CHECKLIST.md`](docs/PRE-DEPLOY-CHECKLIST.md).
Quy trình dựng staging/production độc lập nhà cung cấp nằm tại [`docs/DEPLOYMENT-READY.md`](docs/DEPLOYMENT-READY.md); kịch bản nghiệm thu trước mở bán nằm tại [`docs/UAT-CHECKLIST.md`](docs/UAT-CHECKLIST.md).
Báo cáo kiểm tra kỹ thuật gần nhất nằm tại [`docs/READINESS-REPORT.md`](docs/READINESS-REPORT.md).
