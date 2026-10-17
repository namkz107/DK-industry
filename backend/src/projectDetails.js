module.exports = {
  'he-thong-bang-tai-nha-may': {
    objective: 'Tự động hóa luồng chuyển sản phẩm giữa khu vực đóng gói và tập kết, giảm thao tác nâng chuyển thủ công nhưng không làm gián đoạn dây chuyền hiện hữu.',
    projectScale: '6 cụm băng tải, tổng chiều dài khoảng 120m', durationDays: 45, teamSize: 12,
    description: 'Thiết kế, chế tạo và lắp đặt hệ thống băng tải liên kết các công đoạn đóng gói trong nhà máy, bảo đảm vận hành liên tục và phù hợp mặt bằng hiện hữu.',
    scope: ['Khảo sát mặt bằng và luồng vận chuyển', 'Thiết kế cơ khí, điện điều khiển', 'Chế tạo 6 cụm băng tải', 'Lắp đặt, chạy thử và bàn giao'],
    requirements: ['Tải làm việc thiết kế 50kg/m', 'Điều chỉnh tốc độ theo từng khu vực', 'Có cảm biến chống dồn sản phẩm', 'Bảo đảm lối đi và khoảng cách an toàn'],
    workItems: ['Gia công khung thép sơn tĩnh điện', 'Lắp con lăn, dây băng và cơ cấu căn chỉnh', 'Lắp tủ điều khiển, cảm biến an toàn', 'Đào tạo vận hành và bảo trì cơ bản'],
    technicalHighlights: ['Kết cấu mô-đun thuận tiện bảo trì', 'Điều khiển biến tần và cảm biến quang', 'Nút dừng khẩn cấp theo từng vùng', 'Kiểm tra chạy tải trước nghiệm thu'],
    challenge: 'Mặt bằng hẹp, nhiều điểm giao cắt với thiết bị đang hoạt động và thời gian dừng chuyền bị giới hạn.',
    solution: 'Chia hệ thống thành các mô-đun lắp ghép nhanh, mô phỏng trước cao độ và bố trí cảm biến dừng khẩn cấp tại từng khu vực.',
    results: 'Hệ thống được nghiệm thu đúng tiến độ, vận hành ổn định và giảm thao tác vận chuyển thủ công giữa các công đoạn.',
    stages: [
      { phase: 'before', title: 'Khảo sát hiện trạng và đo đạc', description: 'Đội kỹ thuật ghi nhận luồng sản phẩm, cao độ thiết bị, vị trí cột nhà xưởng và các điểm giao cắt để hoàn thiện phương án bố trí.', images: [{ url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80', caption: 'Khảo sát mặt bằng và xác định các điểm kết nối với dây chuyền hiện hữu.' }] },
      { phase: 'during', title: 'Gia công, lắp ráp và căn chỉnh', description: 'Các mô-đun được gia công tại xưởng, lắp thử và kiểm tra trước khi vận chuyển; tại hiện trường thực hiện căn cao độ, đấu nối và chạy thử từng phân đoạn.', images: [{ url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80', caption: 'Kiểm tra kết cấu và căn chỉnh cụm truyền động trong quá trình lắp ráp.' }] },
      { phase: 'after', title: 'Chạy tải, nghiệm thu và bàn giao', description: 'Hệ thống được chạy không tải, chạy tải thực tế, kiểm tra các tình huống an toàn và bàn giao hướng dẫn vận hành cho bộ phận kỹ thuật.', images: [{ url: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1200&q=80', caption: 'Hệ thống sau hoàn thiện, sẵn sàng đưa vào vận hành sản xuất.' }] }
    ]
  },
  'nha-xuong-cong-nghiep-8000m2': {
    objective: 'Hoàn thiện hệ kết cấu thép đồng bộ cho nhà xưởng sản xuất mới, đáp ứng tiến độ lắp đặt thiết bị và điều kiện khai thác lâu dài.',
    projectScale: 'Nhà xưởng 8.000m²', durationDays: 120, teamSize: 28,
    description: 'Gia công và lắp dựng kết cấu thép cho nhà xưởng sản xuất diện tích 8.000m², bao gồm khung chính, hệ giằng và các hạng mục kim loại phụ trợ.',
    scope: ['Rà soát bản vẽ thi công', 'Gia công kết cấu thép tại xưởng', 'Vận chuyển và lắp dựng tại công trường', 'Kiểm tra liên kết và hoàn thiện chống gỉ'],
    requirements: ['Kiểm soát kích thước cấu kiện theo bản vẽ', 'Kiểm tra ngoại quan và chất lượng mối hàn', 'Lắp dựng theo trình tự an toàn', 'Hoàn thiện lớp bảo vệ bề mặt'],
    workItems: ['Gia công cột, kèo và hệ giằng', 'Kiểm soát kích thước và mối hàn', 'Lắp dựng theo phân khu', 'Hoàn thiện cầu thang, lan can và sàn thao tác'],
    technicalHighlights: ['Đánh mã truy xuất từng cấu kiện', 'Dưỡng kiểm soát kích thước tại xưởng', 'Lắp dựng cuốn chiếu theo phân khu', 'Kiểm tra bu-lông và liên kết trước bàn giao'],
    challenge: 'Khối lượng cấu kiện lớn, yêu cầu đồng bộ cao giữa sản xuất, vận chuyển và tiến độ lắp dựng ngoài công trường.',
    solution: 'Đánh mã cấu kiện theo khu vực, tổ chức giao hàng cuốn chiếu và kiểm tra kích thước tại xưởng trước khi xuất hàng.',
    results: 'Hoàn thành kết cấu theo kế hoạch, bảo đảm khả năng lắp ghép và các yêu cầu kiểm tra chất lượng của dự án.',
    stages: [
      { phase: 'before', title: 'Chuẩn bị mặt bằng và rà soát bản vẽ', description: 'Đối chiếu tim trục, cao độ móng và bản vẽ chế tạo để phát hiện sớm các sai lệch trước khi sản xuất hàng loạt.', images: [{ url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80', caption: 'Kiểm tra hiện trạng công trường và điều kiện tổ chức lắp dựng.' }] },
      { phase: 'during', title: 'Gia công và lắp dựng kết cấu', description: 'Cấu kiện được gia công, kiểm tra, đánh mã và vận chuyển theo từng phân khu; đội lắp dựng triển khai cột, kèo và hệ giằng theo trình tự.', images: [{ url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80', caption: 'Lắp dựng hệ khung chính và kiểm soát độ ổn định tạm thời.' }] },
      { phase: 'after', title: 'Hoàn thiện và nghiệm thu', description: 'Kiểm tra hình học tổng thể, liên kết bu-lông, mối hàn bổ sung và lớp bảo vệ bề mặt trước khi bàn giao cho giai đoạn lắp thiết bị.', images: [{ url: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=80', caption: 'Kết cấu nhà xưởng sau khi hoàn thiện các hạng mục chính.' }] }
    ]
  },
  'day-chuyen-va-he-thong-phu-tro': {
    objective: 'Tích hợp đồng bộ các hạng mục cơ khí, khí nén và điện phụ trợ để dây chuyền mới đủ điều kiện chạy thử và vận hành sản xuất.',
    projectScale: '1 dây chuyền và 4 nhóm hệ thống phụ trợ', durationDays: 60, teamSize: 16,
    description: 'Tích hợp các hạng mục cơ khí và điện phụ trợ cho dây chuyền sản xuất mới, từ bàn thao tác đến đường ống kỹ thuật và tủ điều khiển khu vực.',
    scope: ['Khảo sát nhu cầu tại hiện trường', 'Thiết kế bố trí thiết bị phụ trợ', 'Chế tạo và lắp đặt', 'Chạy thử liên động cùng dây chuyền'],
    requirements: ['Điểm kết nối tương thích thiết bị nhiều nhà cung cấp', 'Bố trí thuận tiện vận hành và bảo trì', 'Tín hiệu liên động được kiểm tra đầy đủ', 'Hồ sơ bàn giao rõ ràng theo từng phân hệ'],
    workItems: ['Chế tạo bàn thao tác và giá đỡ', 'Lắp đặt đường ống khí nén', 'Gia công khung bảo vệ máy', 'Đấu nối tủ điện và kiểm tra tín hiệu'],
    technicalHighlights: ['Chuẩn hóa đầu nối giữa các phân hệ', 'Đánh nhãn đường ống và tín hiệu', 'Kiểm thử I/O theo checklist', 'Nghiệm thu riêng trước khi chạy tổng thể'],
    challenge: 'Nhiều nhóm thiết bị từ các nhà cung cấp khác nhau cần được tích hợp trong cùng lịch chạy thử.',
    solution: 'Chuẩn hóa điểm kết nối, lập danh sách tín hiệu liên động và nghiệm thu từng phân hệ trước khi chạy thử tổng thể.',
    results: 'Các phân hệ phụ trợ hoạt động đồng bộ, đáp ứng điều kiện vận hành và bàn giao hồ sơ hướng dẫn cho bộ phận kỹ thuật.',
    stages: [
      { phase: 'before', title: 'Khảo sát điểm đấu nối', description: 'Tổng hợp tài liệu thiết bị, kiểm tra vị trí thực tế và thống nhất ranh giới công việc giữa các nhóm cung cấp.', images: [{ url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', caption: 'Rà soát vị trí thiết bị và các điểm cần cấp điện, khí nén.' }] },
      { phase: 'during', title: 'Thi công từng phân hệ', description: 'Triển khai song song khung cơ khí, đường ống và điện điều khiển; mỗi phân hệ được kiểm tra độc lập trước khi đấu nối liên động.', images: [{ url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80', caption: 'Lắp đặt, đấu nối và kiểm tra tín hiệu tại khu vực dây chuyền.' }] },
      { phase: 'after', title: 'Chạy thử liên động và bàn giao', description: 'Mô phỏng các trạng thái vận hành, kiểm tra cảnh báo và dừng an toàn trước khi chạy thử cùng dây chuyền sản xuất.', images: [{ url: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1200&q=80', caption: 'Các hệ thống phụ trợ sau hoàn thiện và chạy thử liên động.' }] }
    ]
  }
};
