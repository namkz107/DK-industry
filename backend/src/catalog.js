const photo = (file, caption) => ({ url: `/images/projects/${file}`, caption });

const services = [
  {
    name: 'Đường ống công nghiệp', slug: 'duong-ong-cong-nghiep', order: 1, featured: true, published: true,
    summary: 'Gia công và lắp đặt đường ống khí nén, ống nhiệt, ống nước, ống inox và ống thép mạ kẽm cho nhà máy.',
    capabilities: ['Ống khí nén', 'Ống nhiệt', 'Ống nước', 'Ống inox và ống mạ kẽm'],
    materials: ['Inox', 'Thép mạ kẽm', 'HDPE', 'PPR', 'PVC'],
    applications: ['Nhà máy', 'Phòng máy', 'Đường ống kỹ thuật'],
    image: '/images/projects/ong-inox-vi-sinh.jpg'
  },
  {
    name: 'Ống gió và bảo ôn', slug: 'ong-gio-va-bao-on', order: 2, featured: true, published: true,
    summary: 'Gia công ống gió, lắp đặt và bọc bảo ôn cho hệ thống Chiller, AHU và FCU.',
    capabilities: ['Ống gió', 'Bọc bảo ôn', 'Chiller, AHU, FCU'],
    materials: ['Inox', 'Tôn kẽm', 'Vật liệu bảo ôn'],
    applications: ['Phòng sạch', 'Hệ thống làm lạnh', 'Nhà máy'],
    image: '/images/projects/ong-gio.jpg'
  },
  {
    name: 'Hook-up cơ điện', slug: 'hook-up-co-dien', order: 3, featured: true, published: true,
    summary: 'Thi công hook-up cơ điện gồm hệ thống điện, ống gió, ống khí, sàn nâng và sàn thao tác.',
    capabilities: ['Hệ thống điện', 'Ống gió và ống khí', 'Sàn nâng', 'Sàn thao tác'],
    materials: ['Inox', 'Thép', 'Tôn'],
    applications: ['Dây chuyền sản xuất', 'Phòng máy', 'Phòng sạch'],
    image: '/images/projects/cum-bom.jpg'
  },
  {
    name: 'Kết cấu và cơ khí chính xác', slug: 'ket-cau-va-co-khi-chinh-xac', order: 4, featured: true, published: true,
    summary: 'Gia công kết cấu sàn thao tác, lan can và chi tiết cơ khí chính xác theo yêu cầu từng công trình.',
    capabilities: ['Sàn thao tác', 'Lan can và kết cấu', 'Chi tiết cơ khí chính xác'],
    materials: ['Inox', 'Thép'],
    applications: ['Phòng sạch', 'Nhà xưởng', 'Khu vực bảo dưỡng'],
    image: '/images/projects/san-thao-tac-treo.jpg'
  },
  {
    name: 'Thi công và bảo dưỡng', slug: 'thi-cong-va-bao-duong', order: 5, featured: true, published: true,
    summary: 'Thi công, cải tạo và bảo dưỡng công trình công nghiệp, hỗ trợ kỹ thuật 24/24.',
    capabilities: ['Thi công công trình', 'Cải tạo', 'Bảo dưỡng'],
    materials: ['Thép', 'Inox', 'Vật liệu xây dựng'],
    applications: ['Nhà máy', 'Công trình công nghiệp'],
    image: '/images/projects/san-thao-tac.jpg'
  }
];

const projects = [
  {
    title: 'Hook-up cơ điện nhà máy', slug: 'hook-up-co-dien-nha-may', category: 'Hook-up cơ điện', location: 'Thái Nguyên', year: '2017-2020', featured: true, published: true,
    projectScale: 'Ống gió phòng sạch, ống khí, ống nước, ống cứu hỏa, lan can inox và sàn thao tác sức nâng 20 tấn',
    description: 'Gia công và lắp đặt hook-up cơ điện cho nhà máy điện tử: điện, ống gió, ống khí, sàn nâng, ống inox, ống cứu hỏa, lan can phòng sạch và đường ống nước.',
    objective: 'Đưa các hệ thống cơ điện phụ trợ vào vận hành cùng dây chuyền sản xuất.',
    scope: ['Hệ thống điện', 'Ống gió và ống khí', 'Sàn nâng và sàn thao tác', 'Ống nước, ống cứu hỏa và lan can phòng sạch'],
    workItems: ['Lắp đặt ống gió phòng sạch', 'Gia công ống inox cấp khí và ống thoát nước', 'Lắp ống cứu hỏa và cụm bơm cứu hỏa', 'Gia công lan can inox và sàn thao tác sức nâng 20 tấn'],
    image: '/images/projects/ong-gio.jpg',
    stages: [{
      phase: 'after', title: 'Hạng mục đã lắp đặt',
      description: 'Các hệ thống ống gió, ống kim loại, cứu hỏa, lan can và sàn thao tác sau khi hoàn thiện.',
      images: [
        photo('ong-gio.jpg', 'Ống gió đã lắp trên cao.'),
        photo('ong-gio-phong-sach.jpg', 'Ống gió phòng sạch.'),
        photo('ong-gio-boc.jpg', 'Ống gió sau khi bọc.'),
        photo('ong-inox.jpg', 'Đường ống inox trên cao.'),
        photo('ong-mat-bich.jpg', 'Cụm ống inox nối bích.'),
        photo('bom-cuu-hoa.jpg', 'Cụm bơm cứu hỏa.'),
        photo('ong-cuu-hoa.jpg', 'Ống cứu hỏa.'),
        photo('lan-can-inox.jpg', 'Lan can inox trong phòng sạch.'),
        photo('san-thao-tac-treo.jpg', 'Sàn thao tác và cầu thang lên khu vực máy.')
      ]
    }]
  },
  {
    title: 'Cụm bơm và đường ống dẫn nước', slug: 'cum-bom-va-duong-ong-dan-nuoc', category: 'Đường ống', location: 'Hải Phòng', featured: true, published: true,
    projectScale: 'Phòng bơm công suất 20.000 m³/ngày đêm và ống kẽm DN400',
    description: 'Gia công và lắp đặt máy cho phòng bơm cùng đường ống kẽm dẫn nước DN400.',
    objective: 'Hoàn thiện cụm bơm và tuyến ống dẫn nước cho phòng máy.',
    scope: ['Lắp đặt cụm bơm', 'Gia công và lắp ống kẽm DN400', 'Bọc bảo ôn đường ống'],
    workItems: ['Lắp đặt cụm bơm công suất 20.000 m³/ngày đêm', 'Lắp đường ống kẽm DN400', 'Bọc bảo ôn các đoạn ống'],
    image: '/images/projects/cum-bom.jpg',
    stages: [{
      phase: 'after', title: 'Phòng bơm và tuyến ống',
      description: 'Cụm bơm và đường ống đã lắp, gồm các đoạn đã bọc bảo ôn.',
      images: [
        photo('cum-bom.jpg', 'Cụm bơm trong phòng máy.'),
        photo('ong-bao-on.jpg', 'Đường ống kích thước lớn đã bọc bảo ôn.'),
        photo('ong-kem.jpg', 'Ống kẽm và co đã bọc bảo ôn.')
      ]
    }]
  },
  {
    title: 'Ống gió AHU, bảo ôn và sàn nâng', slug: 'ong-gio-ahu-bao-on-va-san-nang', category: 'Ống gió & bảo ôn', location: 'Hà Nam', featured: true, published: true,
    projectScale: 'Ống gió máy AHU, bọc bảo ôn và sàn nâng treo sức nâng 10 tấn',
    description: 'Thi công ống gió và bọc bảo ôn cho máy AHU, lắp sàn nâng treo và đường ống phụ trợ phòng máy.',
    objective: 'Kết nối hệ thống làm lạnh và các đường ống phụ trợ để phòng máy vận hành được.',
    scope: ['Ống gió máy AHU', 'Bọc bảo ôn', 'Sàn nâng treo', 'Đường ống phòng máy nén và bơm chân không'],
    workItems: ['Lắp ống gió cho máy AHU', 'Bọc bảo ôn máy và đường ống', 'Lắp sàn nâng treo sức nâng 10 tấn', 'Lắp đường ống máy bơm chân không, cải tạo phòng máy nén khí và lắp van điều áp'],
    image: '/images/projects/may-ahu.jpg',
    stages: [{
      phase: 'after', title: 'Máy AHU, bảo ôn và sàn nâng',
      description: 'Máy AHU đã được bọc bảo ôn, cùng sàn nâng treo tại khu vực lắp đặt.',
      images: [
        photo('may-ahu.jpg', 'Máy AHU và đường ống đã bọc bảo ôn.'),
        photo('bao-on.jpg', 'Đường ống sau khi bọc bảo ôn.'),
        photo('san-nang.jpg', 'Sàn nâng treo, nhìn thấy khung đỡ bên dưới.')
      ]
    }]
  },
  {
    title: 'Đường ống inox và bọc bảo ôn', slug: 'duong-ong-inox-va-boc-bao-on', category: 'Đường ống', location: 'Hưng Yên', featured: false, published: true,
    projectScale: 'Đường ống inox công nghiệp, đường ống inox vi sinh và bọc bảo ôn',
    description: 'Gia công, lắp đặt đường ống inox công nghiệp, đường ống inox vi sinh và bọc bảo ôn cho nhà máy.',
    objective: 'Hoàn thiện tuyến ống inox và lớp bảo ôn cho khu vực sản xuất.',
    scope: ['Ống inox công nghiệp', 'Ống inox vi sinh', 'Bọc bảo ôn'],
    workItems: ['Gia công và lắp cụm ống inox', 'Lắp van và đồng hồ trên tuyến ống', 'Bọc bảo ôn các đoạn ống'],
    image: '/images/projects/ong-inox-vi-sinh.jpg',
    stages: [{
      phase: 'after', title: 'Tuyến ống inox',
      description: 'Cụm ống inox và các đoạn đã bọc bảo ôn sau khi lắp đặt.',
      images: [
        photo('ong-inox-vi-sinh.jpg', 'Cụm đường ống inox công nghiệp.'),
        photo('cum-van-bao-on.jpg', 'Cụm van và ống đã bọc bảo ôn.')
      ]
    }]
  },
  {
    title: 'Sàn thao tác bảo dưỡng lọc gió', slug: 'san-thao-tac-bao-duong-loc-gio', category: 'Kết cấu cơ khí', location: 'Hưng Yên', featured: false, published: true,
    projectScale: 'Sàn thao tác trên cao và đường ống gió tươi',
    description: 'Gia công, lắp đặt sàn thao tác để bảo dưỡng cụm lọc gió và đường ống gió tươi.',
    objective: 'Tạo lối tiếp cận an toàn để bảo dưỡng cụm lọc và hoàn thiện tuyến ống gió tươi.',
    scope: ['Sàn thao tác trên cao', 'Đường ống gió tươi'],
    workItems: ['Gia công khung và sàn thao tác', 'Lắp lan can và thang tiếp cận', 'Lắp đặt đường ống gió tươi'],
    image: '/images/projects/san-thao-tac.jpg',
    stages: [{
      phase: 'after', title: 'Sàn thao tác và ống gió',
      description: 'Sàn thao tác trên cao cạnh tuyến ống gió sau khi lắp đặt.',
      images: [photo('san-thao-tac.jpg', 'Sàn thao tác để bảo dưỡng cụm lọc gió.')]
    }]
  }
];

module.exports = { services, projects };
