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
    image: '/images/products/chi-tiet-phay-tien-tam.jpg',
    description: 'Gia công chi tiết cơ khí bằng phay và tiện theo bản vẽ. Vật liệu, dung sai và số lượng theo từng đơn hàng.',
    specifications: { 'Gia công': 'Phay, tiện', 'Căn cứ': 'Bản vẽ kỹ thuật', 'Số lượng': 'Theo đơn hàng' },
    images: ['/images/products/chi-tiet-phay-tien-tam.jpg', '/images/products/chi-tiet-phay-tien-lo.jpg']
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
  },
  {
    name: 'Bàn ghế ăn inox',
    slug: 'ban-ghe-an-inox',
    sku: 'DK-SP-009',
    category: 'Bàn inox',
    unit: 'bộ',
    featured: false,
    image: '/images/products/ban-ghe-an-inox.jpg',
    images: ['/images/products/ban-ghe-an-inox.jpg', '/images/products/ban-ghe-an-inox-xuong.jpg'],
    description: 'Bàn và ghế inox cho khu ăn uống. Mặt bàn, chiều dài và ghế đi kèm làm theo mặt bằng, gia công tại xưởng rồi lắp đặt.',
    specifications: { 'Vật liệu': 'Inox', 'Công dụng': 'Khu ăn uống', 'Thi công': 'Gia công tại xưởng và lắp đặt' }
  },
  {
    name: 'Bàn chậu rửa inox',
    slug: 'ban-chau-rua-inox',
    sku: 'DK-SP-010',
    category: 'Bàn inox',
    unit: 'bộ',
    featured: false,
    image: '/images/products/ban-chau-rua-inox.jpg',
    images: ['/images/products/ban-chau-rua-inox.jpg', '/images/products/ban-chau-rua-inox-2.jpg'],
    description: 'Bàn inox có chậu rửa và khung giá phía trên, dùng để sơ chế hoặc rửa. Kích thước chậu và mặt bàn làm theo vị trí lắp.',
    specifications: { 'Hình thức': 'Bàn, chậu rửa, khung giá', 'Vật liệu': 'Inox', 'Kích thước': 'Theo vị trí lắp' }
  },
  {
    name: 'Nhà để xe mái pin',
    slug: 'nha-de-xe-mai-pin',
    sku: 'DK-SP-011',
    category: 'Nhà để xe',
    unit: 'công trình',
    featured: false,
    image: '/images/products/nha-de-xe-mai-pin.jpg',
    description: 'Nhà để xe khung thép, mái là dàn pin mặt trời. Cột, khẩu độ và số chỗ đỗ làm theo mặt bằng.',
    specifications: { 'Kết cấu': 'Khung thép', 'Mái': 'Dàn pin mặt trời', 'Thi công': 'Gia công và lắp dựng' }
  },
  {
    name: 'Cầu trục',
    slug: 'cau-truc',
    sku: 'DK-SP-012',
    category: 'Cầu trục',
    unit: 'bộ',
    featured: false,
    image: '/images/products/cau-truc.jpg',
    description: 'Cầu trục dầm đôi chạy trong nhà xưởng để nâng tôn, khung và thành phẩm. Khẩu độ và tải trọng theo thiết kế.',
    specifications: { 'Dạng': 'Dầm đôi', 'Công dụng': 'Nâng hạ trong xưởng', 'Tải trọng': 'Theo thiết kế' }
  },
  {
    name: 'Tôn tấm',
    slug: 'ton-tam',
    sku: 'DK-SP-013',
    category: 'Tôn',
    unit: 'tấm',
    featured: false,
    image: '/images/products/ton-tam.jpg',
    description: 'Cắt tôn cuộn thành tấm theo khổ, dùng làm phôi mái, máng, vỏ và chi tiết chấn. Độ dày và kích thước theo yêu cầu.',
    specifications: { 'Dạng': 'Tấm cắt từ cuộn', 'Công dụng': 'Phôi cho mái, máng, vỏ và chi tiết chấn', 'Kích thước': 'Theo khổ cần dùng' }
  },
  {
    name: 'Xe đẩy lồng thép',
    slug: 'xe-day-long-thep',
    sku: 'DK-SP-014',
    category: 'Xe đẩy',
    unit: 'chiếc',
    featured: false,
    image: '/images/products/xe-day-long-thep.jpg',
    description: 'Xe đẩy khung thép, thành lồng và bánh xe để chứa phôi hoặc thành phẩm trong xưởng. Kích thước lồng làm theo hàng cần chở.',
    specifications: { 'Kết cấu': 'Khung thép, thành lồng, bánh xe', 'Công dụng': 'Chứa và di chuyển hàng trong xưởng' }
  },
  {
    name: 'Chi tiết dập, rèn',
    slug: 'chi-tiet-dap-ren',
    sku: 'DK-SP-015',
    category: 'Gia công cơ khí',
    unit: 'lô',
    featured: false,
    image: '/images/products/chi-tiet-dap-ren.jpg',
    description: 'Gia công chi tiết dày bằng búa máy, máy dập và mài. Nhóm này khác phay tiện, dùng khi chi tiết cần dập, rèn hoặc làm sạch mép.',
    specifications: { 'Gia công': 'Dập, rèn, mài', 'Căn cứ': 'Bản vẽ hoặc mẫu', 'Số lượng': 'Theo đơn hàng' }
  },
  {
    name: 'Khung thép',
    slug: 'khung-thep',
    sku: 'DK-SP-016',
    category: 'Kết cấu thép',
    unit: 'bộ',
    featured: false,
    image: '/images/products/khung-thep.jpg',
    description: 'Khung thép tổ hợp và bệ đỡ, gia công bằng hàn. Dùng làm khung thiết bị, bệ máy hoặc kết cấu chịu lực theo bản vẽ.',
    specifications: { 'Kết cấu': 'Khung hộp và bệ thép', 'Liên kết': 'Hàn', 'Căn cứ': 'Bản vẽ' }
  },
  {
    name: 'Mái che lối đi',
    slug: 'mai-che-loi-di',
    sku: 'DK-SP-017',
    category: 'Mái che',
    unit: 'công trình',
    featured: false,
    image: '/images/products/mai-che-loi-di.jpg',
    description: 'Mái che lối đi bằng khung thép, lợp tôn, cột đỡ có nhịp cong. Chiều dài và khẩu độ làm theo lối đi.',
    specifications: { 'Kết cấu': 'Khung thép, mái tôn', 'Công dụng': 'Che lối đi bộ', 'Kích thước': 'Theo mặt bằng' }
  }
].map(product => ({
  ...product,
  price: null,
  priceOnRequest: true,
  stock: 0,
  active: true,
  images: product.images?.length ? product.images : (product.image ? [product.image] : [])
}));

module.exports = { catalogProducts };
