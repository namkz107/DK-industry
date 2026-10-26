const defaultEquipment = [
  { name: 'Máy đột dập', summary: 'Máy dùng khuôn để đột lỗ và tạo hình trên tấm tôn.', purpose: 'Làm lỗ, cắt biên dạng và dập các chi tiết lặp lại như tai bắt, mặt bích nhỏ, nắp tôn.', notes: 'Phù hợp khi cần nhiều chi tiết giống nhau. Độ dày tôn gia công được phụ thuộc lực máy và khuôn.', images: ['/images/equipment/dot-dap-xuong.jpg'] },
  { name: 'Máy chấn', summary: 'Máy gấp tấm tôn theo góc bằng dao chấn.', purpose: 'Tạo máng, nắp, gá, má bích và các chi tiết cần mép gấp.', notes: 'Góc uốn và bán kính phụ thuộc dao, cối và độ dày tôn. Tôn được giữ và gấp từng nhịp.', images: ['/images/equipment/chan.jpg'] },
  { name: 'Máy cắt laser', summary: 'Máy cắt tấm kim loại bằng tia laser theo bản vẽ.', purpose: 'Cắt phôi tôn, inox theo biên dạng và lỗ trước khi chấn, đột hoặc hàn.', notes: 'Đầu cắt chạy trên bàn, tấm được đặt phẳng. Đường cắt theo file bản vẽ, mép cắt gọn.', images: ['/images/equipment/cat-laser.jpg'] },
  { name: 'Máy cắt tôn', summary: 'Máy cắt tấm tôn thành phôi thẳng trước khi gia công tiếp.', purpose: 'Xả tôn cuộn hoặc tấm thành khổ cần dùng cho máng, ống gió và chi tiết kết cấu.', notes: 'Đường cắt thẳng, chiều dài cắt phụ thuộc khổ máy. Phôi sau khi cắt được chuyển sang chấn, đột hoặc hàn.', images: ['/images/equipment/cat-ton-1.jpg'] },
  { name: 'Máy uốn tôn', summary: 'Máy lốc tấm tôn thành cung hoặc ống tròn.', purpose: 'Lốc máng cong, ống gió tròn và các chi tiết tôn cần độ cong đều.', notes: 'Ba trục lốc ép tấm đi qua và uốn dần. Bán kính phụ thuộc khoảng cách trục và độ dày tôn.', images: ['/images/equipment/uon-ton.jpg'] },
  { name: 'Máy hàn laser', summary: 'Máy hàn kim loại bằng chùm tia laser và khí bảo vệ.', purpose: 'Hàn mối mỏng trên tôn, inox và chi tiết cần ít biến dạng nhiệt.', notes: 'Đầu hàn đi dọc mối, khí bảo vệ vùng hàn. Phù hợp đường hàn dài và chi tiết cần bề mặt gọn.', images: ['/images/equipment/han-laser.jpg'] },
  { name: 'Máy hàn', summary: 'Máy hàn nối các chi tiết kim loại thành một khối.', purpose: 'Hàn ống, kết cấu, máng tôn và các mối liên kết tại xưởng trước khi đưa ra công trình.', notes: 'Thường dùng hồ quang que hoặc khí bảo vệ. Mối hàn được làm sạch và kiểm tra trước khi lắp đặt.', images: ['/images/equipment/han-ho-quang.png'] },
  { name: 'Máy tiện ren', summary: 'Máy tiện ren trên đầu ống thép để bắt khớp nối.', purpose: 'Tạo ren ngoài cho ống nước, ống khí và các mối nối bằng rắc co, măng sông.', notes: 'Ống được kẹp và dao ren chạy dọc đầu ống. Ren đúng bước thì mối nối kín và tháo lắp được.', images: ['/images/equipment/tien-ren-xuong.jpg'] },
  { name: 'Máy khoan', summary: 'Máy khoan lỗ trên kim loại bằng mũi khoan đứng.', purpose: 'Khoan lỗ bắt bulông, lỗ định vị và lỗ chờ trên chi tiết tôn, thép.', notes: 'Phôi được kẹp chặt trên bàn máy. Đường kính lỗ theo mũi khoan và độ dày vật liệu.', images: ['/images/equipment/khoan-xuong.jpg'] },
  { name: 'Máy mài, cắt cầm tay', summary: 'Máy cầm tay để mài mép, làm sạch và cắt chi tiết nhỏ.', purpose: 'Cắt đoạn thép, mài mối hàn, bo mép tôn ngay tại xưởng hoặc trên công trình.', notes: 'Dùng đá mài hoặc lưỡi cắt. Đây là thiết bị cầm tay, bổ sung cho các máy cố định.', images: ['/images/equipment/mai-cat.jpg'] },
  { name: 'Xe nâng', summary: 'Xe nâng động cơ để nâng và di chuyển hàng nặng trong xưởng.', purpose: 'Chuyển tôn, ống, thành phẩm và pallet giữa khu gia công, khu tập kết và điểm xếp hàng.', notes: 'Người lái ngồi trên xe và nâng hàng bằng càng phía trước. Dùng cho kiện nặng hơn sức của xe kéo tay.', images: ['/images/equipment/xe-nang-xuong.png'] },
  { name: 'Máy bắn cốt', summary: 'Máy chiếu tia laser để lấy cao độ và đường thẳng.', purpose: 'Lấy cốt sàn, tim tuyến ống và cao độ lắp đặt ngoài công trình.', notes: 'Đặt trên chân ba, tự cân bằng và chiếu tia ngang hoặc đứng. Thợ đọc tia bằng thước hoặc mắt nhận.', images: ['/images/equipment/ban-cot.jpg'] }
];

const previousEquipmentImages = {
  '/images/equipment/chan-1.jpg': '/images/equipment/chan.jpg',
  '/images/equipment/chan-2.jpg': '/images/equipment/chan.jpg',
  '/images/equipment/han.jpg': '/images/equipment/han-ho-quang.png',
  '/images/equipment/han-xuong.jpg': '/images/equipment/han-ho-quang.png',
  '/images/equipment/tien-ren.jpg': '/images/equipment/tien-ren-xuong.jpg',
  '/images/equipment/xe-nang.jpg': '/images/equipment/xe-nang-xuong.png',
  '/images/equipment/khoan.jpg': '/images/equipment/khoan-xuong.jpg',
  '/images/equipment/dot-dap.jpg': '/images/equipment/dot-dap-xuong.jpg',
  '/images/equipment/mai-1.jpg': '/images/equipment/mai-cat.jpg',
  '/images/equipment/mai-2.jpg': '/images/equipment/mai-cat.jpg',
  '/images/equipment/mai-xuong.jpg': '/images/equipment/mai-cat.jpg'
};

const defaultOrgUnits = [
  { name: 'Hội đồng cổ đông', note: 'Cơ quan quyền lực cao nhất của công ty', tier: 1 },
  { name: 'Ban kiểm soát', note: 'Giám sát việc tuân thủ điều lệ và pháp luật', tier: 2 },
  { name: 'Giám đốc', note: 'Điều hành hoạt động hằng ngày', tier: 2 },
  { name: 'Phó giám đốc', note: 'Điều hành theo phân công của giám đốc', tier: 3 },
  { name: 'Kế toán', note: 'Theo dõi tài chính và chứng từ', tier: 3 },
  { name: 'Phòng thiết kế công trình', note: 'Bản vẽ và hồ sơ công trình', tier: 4 },
  { name: 'Phòng thiết kế công nghệ', note: 'Phương án kỹ thuật cho từng hạng mục', tier: 4 },
  { name: 'Phòng tư vấn giám sát', note: 'Kiểm soát chất lượng tại hiện trường', tier: 4 },
  { name: 'Xưởng sản xuất', note: 'Gia công và chuẩn bị vật tư', tier: 4 },
  { name: 'Xí nghiệp xây lắp 1', note: 'Thi công và lắp đặt', tier: 4 },
  { name: 'Xí nghiệp xây lắp 2', note: 'Thi công và lắp đặt', tier: 4 }
];

function presentSiteSetting(setting) {
  const equipment = setting && Array.isArray(setting.equipment)
    ? setting.equipment.map(item => {
      const fallback = defaultEquipment.find(machine => machine.name === item.name);
      const images = (Array.isArray(item.images) ? item.images : [])
        .map(src => previousEquipmentImages[src] || src)
        .filter(Boolean);
      return {
        name: item.name,
        summary: item.summary || (fallback ? fallback.summary : ''),
        purpose: item.purpose || (fallback ? fallback.purpose : ''),
        notes: item.notes || (fallback ? fallback.notes : ''),
        images: (images.length ? images : (fallback ? fallback.images : [])).slice(0, 2)
      };
    })
    : defaultEquipment;
  const orgUnits = setting && Array.isArray(setting.orgUnits)
    ? setting.orgUnits.map(item => ({ name: item.name, note: item.note || '', tier: item.tier }))
    : defaultOrgUnits;
  return {
    leaderImage: setting && setting.leaderImage ? setting.leaderImage : null,
    equipment,
    orgUnits
  };
}

module.exports = { defaultEquipment, defaultOrgUnits, presentSiteSetting };
