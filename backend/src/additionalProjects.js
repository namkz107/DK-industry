module.exports = [
  {
    title: 'Hệ thống Jig lắp ráp linh kiện', slug: 'he-thong-jig-lap-rap-linh-kien', category: 'Jig & đồ gá', location: 'Bắc Giang', year: '2025', projectScale: '12 bộ Jig cho 3 công đoạn', durationDays: 35, teamSize: 8,
    description: 'Thiết kế và chế tạo bộ Jig định vị, lắp ráp và kiểm tra linh kiện cho dây chuyền sản xuất hàng loạt.', objective: 'Ổn định vị trí lắp ráp, giảm sai lỗi thao tác và rút ngắn thời gian chu kỳ tại ba công đoạn chính.',
    scope: ['Khảo sát thao tác hiện tại', 'Thiết kế 3D và duyệt mẫu', 'Chế tạo 12 bộ Jig', 'Chạy thử và hiệu chỉnh tại line'], requirements: ['Định vị lặp lại ổn định', 'Thao tác thay mã hàng nhanh', 'Có cơ cấu chống lắp sai', 'Bề mặt tiếp xúc không làm xước sản phẩm'],
    workItems: ['Phay CNC chi tiết chính xác', 'Lắp cảm biến xác nhận vị trí', 'Đi dây và hoàn thiện cơ cấu', 'Lập checklist nghiệm thu'], technicalHighlights: ['Chốt định vị thay nhanh', 'Cảm biến poka-yoke', 'Chi tiết tiếp xúc dùng POM', 'Kiểm tra lặp lại trước bàn giao'],
    challenge: 'Nhiều mã sản phẩm có hình dáng gần giống nhau nhưng sai khác nhỏ ở vị trí lắp.', solution: 'Thiết kế cụm định vị thay nhanh kết hợp cảm biến nhận dạng và cơ cấu chống gá sai.', results: 'Thao tác đồng đều hơn, giảm thời gian căn chỉnh và hỗ trợ kiểm soát lỗi ngay tại công đoạn.',
    stages: [
      { phase: 'before', title: 'Phân tích thao tác và mẫu sản phẩm', description: 'Ghi nhận trình tự lắp ráp, điểm tỳ và các lỗi thường gặp để xác định chuẩn định vị.', images: [{ url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1200&q=80', caption: 'Đo kiểm mẫu và xác định các vị trí cần định vị.' }] },
      { phase: 'during', title: 'Gia công và lắp thử Jig', description: 'Gia công các chi tiết, lắp cơ cấu và thử nghiệm khả năng thay đổi giữa các mã hàng.', images: [{ url: 'https://images.unsplash.com/photo-1565439312106-298fa03a5364?auto=format&fit=crop&w=1200&q=80', caption: 'Gia công chi tiết chính xác cho bộ Jig.' }] },
      { phase: 'after', title: 'Chạy thử tại dây chuyền', description: 'Hiệu chỉnh cảm biến, kiểm tra chu kỳ và bàn giao hướng dẫn thay mã hàng.', images: [{ url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80', caption: 'Bộ Jig sau khi hoàn thiện và chạy thử.' }] }
    ], featured: false, published: true, image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Cụm bàn thao tác phòng sạch', slug: 'cum-ban-thao-tac-phong-sach', category: 'Thiết bị phòng sạch', location: 'Thái Nguyên', year: '2025', projectScale: '24 bàn thao tác và 8 tủ inox', durationDays: 28, teamSize: 10,
    description: 'Chế tạo và lắp đặt hệ bàn thao tác, tủ chứa đồ inox cho khu vực lắp ráp có yêu cầu kiểm soát vệ sinh.', objective: 'Tổ chức lại vị trí thao tác, lưu trữ dụng cụ gọn gàng và đáp ứng yêu cầu vệ sinh của khu sản xuất.',
    scope: ['Khảo sát kích thước vị trí đặt', 'Thiết kế bàn và tủ theo công thái học', 'Gia công inox và hoàn thiện bề mặt', 'Lắp đặt theo từng khu vực'], requirements: ['Bề mặt dễ vệ sinh', 'Bo cạnh an toàn', 'Kích thước phù hợp tư thế thao tác', 'Bánh xe khóa cho các cụm di động'],
    workItems: ['Cắt chấn inox tấm', 'Hàn TIG và xử lý mối hàn', 'Lắp phụ kiện và ổ điện', 'Kiểm tra hoàn thiện bề mặt'], technicalHighlights: ['Inox SUS304', 'Mối hàn xử lý phẳng', 'Kết cấu tháo lắp mô-đun', 'Mặt bàn tăng cứng chống rung'],
    challenge: 'Thi công trong khu vực đang hoàn thiện, kích thước thực tế thay đổi theo từng vị trí.', solution: 'Chốt kích thước theo từng cụm và tổ chức giao hàng cuốn chiếu để hiệu chỉnh ngay tại chỗ.', results: 'Các vị trí làm việc được bố trí đồng bộ, gọn và thuận tiện vệ sinh sau mỗi ca.',
    stages: [
      { phase: 'before', title: 'Khảo sát khu vực lắp đặt', description: 'Đo vị trí, kiểm tra lối vận chuyển và xác nhận nhu cầu sử dụng tại từng bàn.', images: [{ url: 'https://images.unsplash.com/photo-1581093458791-9d42e3c8f59b?auto=format&fit=crop&w=1200&q=80', caption: 'Ghi nhận mặt bằng trước khi bố trí thiết bị.' }] },
      { phase: 'during', title: 'Gia công và hoàn thiện inox', description: 'Cắt chấn, hàn TIG, mài xử lý bề mặt và lắp thử phụ kiện tại xưởng.', images: [{ url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80', caption: 'Hoàn thiện kết cấu và kiểm tra bề mặt inox.' }] },
      { phase: 'after', title: 'Bố trí và bàn giao', description: 'Lắp đặt theo layout, cân chỉnh và kiểm tra khả năng vệ sinh, di chuyển.', images: [{ url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80', caption: 'Cụm bàn thao tác sau khi bố trí hoàn chỉnh.' }] }
    ], featured: false, published: true, image: 'https://images.unsplash.com/photo-1581093458791-9d42e3c8f59b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Hệ thống cover bảo vệ máy CNC', slug: 'he-thong-cover-bao-ve-may-cnc', category: 'Gia công kim loại tấm', location: 'Hà Nội', year: '2024', projectScale: '10 bộ cover máy', durationDays: 40, teamSize: 9,
    description: 'Thiết kế, gia công và lắp đặt hệ cover kim loại tấm bảo vệ khu vực chuyển động của cụm máy CNC.', objective: 'Tăng mức độ an toàn, hạn chế phoi và dầu làm mát phát tán nhưng vẫn thuận tiện tiếp cận bảo trì.',
    scope: ['Đo quét kích thước máy', 'Thiết kế cover và cửa bảo trì', 'Cắt laser, chấn và sơn hoàn thiện', 'Lắp đặt không ảnh hưởng kết cấu máy'], requirements: ['Che kín vùng chuyển động', 'Cửa có khóa liên động', 'Tháo lắp thuận tiện bảo trì', 'Màu sơn đồng bộ thiết bị'],
    workItems: ['Dựng mô hình 3D', 'Cắt laser và chấn CNC', 'Hàn khung, sơn tĩnh điện', 'Lắp kính và khóa an toàn'], technicalHighlights: ['Thiết kế mô-đun', 'Kính quan sát chịu va đập', 'Khóa liên động an toàn', 'Khay gom dầu và phoi'],
    challenge: 'Không có đầy đủ bản vẽ máy và không được khoan thay đổi thân thiết bị.', solution: 'Đo trực tiếp, thiết kế gá kẹp tại các điểm có sẵn và chia cover thành mô-đun lắp ráp.', results: 'Khu vực vận hành sạch hơn, giảm tiếp xúc với bộ phận chuyển động và vẫn bảo đảm thao tác bảo trì.',
    stages: [
      { phase: 'before', title: 'Đo hiện trạng máy', description: 'Đo các vùng chuyển động, cửa thao tác và điểm có thể liên kết mà không thay đổi máy.', images: [{ url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', caption: 'Kiểm tra hiện trạng và vùng cần bảo vệ.' }] },
      { phase: 'during', title: 'Chế tạo cover mô-đun', description: 'Cắt chấn các tấm, lắp thử khung và kiểm tra khe hở chuyển động.', images: [{ url: 'https://images.unsplash.com/photo-1565439312106-298fa03a5364?auto=format&fit=crop&w=1200&q=80', caption: 'Gia công các chi tiết kim loại tấm tại xưởng.' }] },
      { phase: 'after', title: 'Lắp đặt và kiểm tra an toàn', description: 'Căn chỉnh cửa, khóa liên động và kiểm tra khả năng tiếp cận bảo trì.', images: [{ url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80', caption: 'Cover sau khi hoàn thiện và lắp đặt.' }] }
    ], featured: false, published: true, image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Giá kệ kho tải trọng nặng', slug: 'gia-ke-kho-tai-trong-nang', category: 'Thiết bị nhà xưởng', location: 'Hải Dương', year: '2024', projectScale: '180 bộ kệ, 3 tầng tải', durationDays: 50, teamSize: 14,
    description: 'Thiết kế, sản xuất và lắp đặt hệ giá kệ lưu trữ vật tư tải trọng nặng cho kho nhà máy.', objective: 'Tăng sức chứa kho, phân vùng vật tư rõ ràng và bảo đảm an toàn khi xe nâng xuất nhập hàng.',
    scope: ['Khảo sát nền kho và luồng xe nâng', 'Tính toán cấu hình kệ', 'Gia công và sơn hoàn thiện', 'Lắp đặt, đánh số vị trí'], requirements: ['Tải trọng theo từng tầng kệ', 'Khoảng cách phù hợp xe nâng', 'Có bảo vệ chân cột', 'Biển tải trọng tại từng dãy'],
    workItems: ['Gia công cột và beam', 'Sơn tĩnh điện', 'Lắp dựng và neo nền', 'Kiểm tra độ thẳng, liên kết'], technicalHighlights: ['Beam điều chỉnh cao độ', 'Khóa an toàn chống bật', 'Bảo vệ chân cột', 'Mã hóa vị trí lưu kho'],
    challenge: 'Kho vẫn vận hành trong thời gian thi công và mặt nền có sai lệch cục bộ.', solution: 'Chia khu vực lắp đặt theo ca, dùng tấm căn chân và kiểm tra cao độ từng dãy.', results: 'Mặt bằng kho được khai thác hiệu quả hơn, lối xe nâng rõ ràng và vật tư dễ truy xuất.',
    stages: [
      { phase: 'before', title: 'Khảo sát kho và luồng vận hành', description: 'Đo mặt bằng, ghi nhận tải vật tư và bán kính quay của xe nâng.', images: [{ url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80', caption: 'Hiện trạng khu vực kho trước khi bố trí kệ.' }] },
      { phase: 'during', title: 'Lắp dựng theo phân khu', description: 'Lắp cột, beam, giằng và neo nền theo từng dãy để không ảnh hưởng toàn bộ kho.', images: [{ url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80', caption: 'Căn chỉnh các dãy kệ trong quá trình lắp đặt.' }] },
      { phase: 'after', title: 'Kiểm tra và đánh số vị trí', description: 'Kiểm tra liên kết, gắn biển tải trọng và mã vị trí trước bàn giao.', images: [{ url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80', caption: 'Hệ giá kệ hoàn thiện và sẵn sàng đưa vào sử dụng.' }] }
    ], featured: false, published: true, image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Hệ thống hút khói bếp công nghiệp', slug: 'he-thong-hut-khoi-bep-cong-nghiep', category: 'Thiết bị inox', location: 'Quảng Ninh', year: '2023', projectScale: '2 khu bếp, 38m đường ống', durationDays: 32, teamSize: 11,
    description: 'Thiết kế và thi công hệ chụp hút, đường ống và quạt hút cho khu bếp công nghiệp công suất lớn.', objective: 'Thu gom khói, nhiệt và hơi dầu hiệu quả, cải thiện môi trường làm việc và thuận tiện vệ sinh định kỳ.',
    scope: ['Khảo sát thiết bị sinh nhiệt', 'Tính toán lưu lượng hút', 'Gia công chụp và đường ống', 'Lắp quạt, chạy thử cân bằng'], requirements: ['Inox phù hợp môi trường bếp', 'Thu gom dầu và dễ vệ sinh', 'Độ ồn trong giới hạn vận hành', 'Bố trí cửa thăm bảo trì'],
    workItems: ['Gia công chụp hút inox', 'Chế tạo đường ống và co cút', 'Lắp quạt, tiêu âm', 'Đo kiểm luồng hút'], technicalHighlights: ['Phin lọc mỡ tháo rời', 'Máng thu dầu', 'Cửa thăm vệ sinh', 'Khớp nối giảm rung'],
    challenge: 'Không gian trần hạn chế và tuyến ống phải tránh nhiều hệ kỹ thuật hiện hữu.', solution: 'Khảo sát đồng bộ cao độ, chia tuyến ống theo mô-đun và sử dụng co chuyển hướng tối ưu tổn thất.', results: 'Khói và nhiệt được thu gom tốt hơn, khu vực bếp thông thoáng và thuận tiện bảo trì vệ sinh.',
    stages: [
      { phase: 'before', title: 'Khảo sát nguồn khói và tuyến ống', description: 'Ghi nhận vị trí bếp, lưu lượng yêu cầu và không gian trần kỹ thuật.', images: [{ url: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80', caption: 'Hiện trạng khu bếp trước khi lắp hệ hút.' }] },
      { phase: 'during', title: 'Gia công và lắp đặt', description: 'Lắp chụp hút, đường ống, quạt và các cụm giảm rung theo từng khu vực.', images: [{ url: 'https://images.unsplash.com/photo-1605218427368-35b3a9116a31?auto=format&fit=crop&w=1200&q=80', caption: 'Gia công và lắp ghép các mô-đun inox.' }] },
      { phase: 'after', title: 'Cân chỉnh và bàn giao', description: 'Chạy thử, kiểm tra hướng hút và hướng dẫn tháo vệ sinh phin lọc.', images: [{ url: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80', caption: 'Hệ thống sau khi hoàn thiện tại khu bếp.' }] }
    ], featured: false, published: true, image: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80'
  }
];
