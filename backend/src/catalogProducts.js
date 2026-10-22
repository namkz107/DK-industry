const catalogProducts = [
  {
    name: 'Bọc bảo ôn',
    slug: 'boc-bao-on',
    sku: 'DK-SP-001',
    category: 'Bảo ôn',
    unit: 'hạng mục',
    featured: true,
    image: '/images/products/boc-bao-on.jpg',
    description: 'Bọc bảo ôn cho đường ống, van và thiết bị để giữ nhiệt và chống đọng sương. Vật liệu và độ dày làm theo hệ thống thực tế.',
    specifications: { 'Phạm vi': 'Ống, van, thiết bị', 'Vật liệu': 'Theo yêu cầu hệ thống', 'Thi công': 'Gia công và lắp đặt tại công trình' }
  },
  {
    name: 'Nhà để xe',
    slug: 'nha-de-xe',
    sku: 'DK-SP-002',
    category: 'Nhà để xe',
    unit: 'công trình',
    featured: true,
    image: '/images/products/nha-de-xe.jpg',
    description: 'Gia công và lắp dựng nhà để xe khung thép, mái tôn. Kích thước và kiểu mái làm theo mặt bằng.',
    specifications: { 'Kết cấu': 'Khung thép, mái tôn', 'Kích thước': 'Theo mặt bằng', 'Thi công': 'Gia công tại xưởng và lắp dựng', 'Nguồn ảnh': 'Jarkko Lauri, CC BY-SA 4.0, Wikimedia Commons' }
  },
  {
    name: 'Cover máy',
    slug: 'cover-may',
    sku: 'DK-SP-003',
    category: 'Cover máy',
    unit: 'bộ',
    featured: true,
    image: '/images/products/cover-may.jpg',
    description: 'Chế tạo vỏ che máy, khung bảo vệ và tấm ốp. Làm theo kích thước máy và yêu cầu vận hành.',
    specifications: { 'Hình thức': 'Vỏ che, khung bảo vệ, tấm ốp', 'Kích thước': 'Theo máy thực tế', 'Vật liệu': 'Tôn hoặc inox theo yêu cầu', 'Nguồn ảnh': 'Machine4545, CC BY-SA 4.0, Wikimedia Commons' }
  },
  {
    name: 'Bàn thao tác',
    slug: 'ban-thao-tac',
    sku: 'DK-SP-004',
    category: 'Bàn thao tác',
    unit: 'bộ',
    featured: false,
    image: '/images/products/ban-thao-tac.jpg',
    description: 'Bàn thao tác cho lắp ráp, kiểm tra và làm việc tại xưởng. Mặt bàn, số tầng và khả năng di chuyển làm theo yêu cầu.',
    specifications: { 'Công dụng': 'Lắp ráp, kiểm tra, thao tác', 'Kết cấu': 'Theo bản vẽ hoặc hiện trạng', 'Vật liệu': 'Thép hoặc inox theo yêu cầu', 'Nguồn ảnh': 'Dietmar Rabich, CC BY-SA 4.0, Wikimedia Commons' }
  },
  {
    name: 'Băng tải',
    slug: 'bang-tai',
    sku: 'DK-SP-005',
    category: 'Băng tải',
    unit: 'hệ thống',
    featured: false,
    image: '/images/products/bang-tai.jpg',
    description: 'Băng tải và băng chuyền để chuyển vật tư trong xưởng hoặc trên line. Chiều dài, tải trọng và loại băng làm theo mặt bằng.',
    specifications: { 'Công dụng': 'Chuyển vật tư, kết nối line', 'Chiều dài': 'Theo mặt bằng', 'Tải trọng': 'Theo hàng hóa cần chuyển' }
  },
  {
    name: 'Chi tiết phay tiện cơ khí',
    slug: 'chi-tiet-phay-tien',
    sku: 'DK-SP-006',
    category: 'Gia công cơ khí',
    unit: 'lô',
    featured: false,
    image: '/images/products/chi-tiet-phay-tien.jpg',
    description: 'Gia công chi tiết cơ khí bằng phay và tiện theo bản vẽ. Vật liệu, dung sai và số lượng theo từng đơn hàng.',
    specifications: { 'Gia công': 'Phay, tiện', 'Căn cứ': 'Bản vẽ kỹ thuật', 'Số lượng': 'Theo đơn hàng' }
  },
  {
    name: 'Vỏ tủ điện',
    slug: 'vo-tu-dien',
    sku: 'DK-SP-007',
    category: 'Tủ điện',
    unit: 'tủ',
    featured: false,
    image: '/images/products/vo-tu-dien.jpg',
    description: 'Sản xuất vỏ tủ điện bằng tôn hoặc inox. Kích thước, cửa và lỗ đi dây làm theo thiết kế tủ.',
    specifications: { 'Sản phẩm': 'Vỏ tủ, chưa gồm thiết bị điện bên trong', 'Vật liệu': 'Tôn hoặc inox', 'Kích thước': 'Theo thiết kế tủ', 'Nguồn ảnh': 'Elmschrat, CC BY-SA 3.0, Wikimedia Commons' }
  },
  {
    name: 'Tủ locker inox',
    slug: 'tu-locker-inox',
    sku: 'DK-SP-008',
    category: 'Tủ inox',
    unit: 'bộ',
    featured: false,
    image: '/images/products/tu-locker-inox.jpg',
    description: 'Tủ locker inox nhiều ngăn để đồ nhân viên hoặc đồ dùng trong xưởng. Số ngăn và kích thước làm theo yêu cầu.',
    specifications: { 'Vật liệu': 'Inox', 'Số ngăn': 'Theo yêu cầu', 'Vị trí': 'Xưởng hoặc khu thay đồ', 'Nguồn ảnh': 'spinster cardigan, CC BY 2.0, Wikimedia Commons' }
  }
].map(product => ({
  ...product,
  price: null,
  priceOnRequest: true,
  stock: 0,
  active: true,
  images: product.image ? [product.image] : []
}));

module.exports = { catalogProducts };
