require('dotenv').config();
const connectDatabase = require('./config/database');
const Product = require('./models/Product');
const Project = require('./models/Project');
const Lead = require('./models/Lead');
const Service = require('./models/Service');
const bootstrapAdmin = require('./services/bootstrapAdmin');
const { services, projects } = require('./catalog');

const products = [
  { name: 'Bộ truyền động công nghiệp', slug: 'bo-truyen-dong-cong-nghiep', sku: 'DK-TD-001', category: 'Truyền động', price: 4850000, unit: 'bộ', stock: 18, featured: true, image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80' },
  { name: 'Vòng bi tải trọng cao', slug: 'vong-bi-tai-trong-cao', sku: 'DK-VB-002', category: 'Linh kiện cơ khí', price: 780000, unit: 'chiếc', stock: 60, featured: true, image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80' },
  { name: 'Tủ điện điều khiển', slug: 'tu-dien-dieu-khien', sku: 'DK-TD-003', category: 'Thiết bị điện', priceOnRequest: true, unit: 'tủ', stock: 4, featured: true, image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80' },
  { name: 'Băng tải con lăn công nghiệp', slug: 'bang-tai-con-lan-cong-nghiep', sku: 'DK-BT-004', category: 'Băng tải & tự động hóa', priceOnRequest: true, unit: 'hệ thống', stock: 0, featured: true, image: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?auto=format&fit=crop&w=900&q=80' },
  { name: 'Bàn thao tác lắp ráp', slug: 'ban-thao-tac-lap-rap', sku: 'DK-BT-005', category: 'Thiết bị nhà xưởng', priceOnRequest: true, unit: 'bộ', stock: 6, image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80' },
  { name: 'Giá kệ công nghiệp tải nặng', slug: 'gia-ke-cong-nghiep-tai-nang', sku: 'DK-GK-006', category: 'Thiết bị nhà xưởng', priceOnRequest: true, unit: 'bộ', stock: 10, image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=900&q=80' },
  { name: 'Xe đẩy hàng inox', slug: 'xe-day-hang-inox', sku: 'DK-XD-007', category: 'Sản phẩm inox', price: 3200000, unit: 'chiếc', stock: 12, image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Tủ đồ phòng sạch', slug: 'tu-do-phong-sach', sku: 'DK-PS-008', category: 'Thiết bị phòng sạch', priceOnRequest: true, unit: 'tủ', stock: 4, image: 'https://images.unsplash.com/photo-1581093458791-9d42e3c8f59b?auto=format&fit=crop&w=900&q=80' },
  { name: 'Chụp hút khói bếp inox', slug: 'chup-hut-khoi-bep-inox', sku: 'DK-BI-009', category: 'Thiết bị bếp inox', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=900&q=80' }
];

// Danh mục tham khảo từ nhu cầu phổ biến của ngành; nội dung và ảnh được biên soạn riêng cho DK Industry.
products.push(
  { name: 'Bàn làm việc nhiều tầng phòng sạch', slug: 'ban-lam-viec-nhieu-tang-phong-sach', sku: 'DK-PS-010', category: 'Thiết bị phòng sạch', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1581093458791-9d42e3c8f59b?auto=format&fit=crop&w=900&q=80' },
  { name: 'Bàn phòng sạch mặt đột lỗ', slug: 'ban-phong-sach-mat-dot-lo', sku: 'DK-PS-011', category: 'Thiết bị phòng sạch', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80' },
  { name: 'Bàn thao tác hai tầng', slug: 'ban-thao-tac-hai-tang', sku: 'DK-BT-012', category: 'Bàn thao tác', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80' },
  { name: 'Bàn thao tác di động', slug: 'ban-thao-tac-di-dong', sku: 'DK-BT-013', category: 'Bàn thao tác', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&q=80' },
  { name: 'Bàn thao tác inox', slug: 'ban-thao-tac-inox', sku: 'DK-BT-014', category: 'Bàn thao tác', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80' },
  { name: 'Bàn thao tác khung nhôm định hình', slug: 'ban-thao-tac-khung-nhom-dinh-hinh', sku: 'DK-BT-015', category: 'Bàn thao tác', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80' },
  { name: 'Băng chuyền line sản xuất', slug: 'bang-chuyen-line-san-xuat', sku: 'DK-BC-016', category: 'Băng tải & tự động hóa', priceOnRequest: true, unit: 'hệ thống', stock: 0, image: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=900&q=80' },
  { name: 'Băng tải xích con lăn', slug: 'bang-tai-xich-con-lan', sku: 'DK-BC-017', category: 'Băng tải & tự động hóa', priceOnRequest: true, unit: 'hệ thống', stock: 0, image: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?auto=format&fit=crop&w=900&q=80' },
  { name: 'Băng tải xích tấm nhà máy', slug: 'bang-tai-xich-tam-nha-may', sku: 'DK-BC-018', category: 'Băng tải & tự động hóa', priceOnRequest: true, unit: 'hệ thống', stock: 0, image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80' },
  { name: 'Giá kệ bốn tầng phòng sạch', slug: 'gia-ke-bon-tang-phong-sach', sku: 'DK-GK-019', category: 'Giá kệ công nghiệp', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=900&q=80' },
  { name: 'Giá kệ kho hàng', slug: 'gia-ke-kho-hang', sku: 'DK-GK-020', category: 'Giá kệ công nghiệp', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Giá kệ trưng bày', slug: 'gia-ke-trung-bay', sku: 'DK-GK-021', category: 'Giá kệ công nghiệp', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=900&q=80' },
  { name: 'Tủ inox nhiều tầng', slug: 'tu-inox-nhieu-tang', sku: 'DK-TI-022', category: 'Tủ công nghiệp', priceOnRequest: true, unit: 'tủ', stock: 0, image: 'https://images.unsplash.com/photo-1581093458791-9d42e3c8f59b?auto=format&fit=crop&w=900&q=80' },
  { name: 'Tủ điện và cover bảo vệ máy', slug: 'tu-dien-cover-bao-ve-may', sku: 'DK-CM-023', category: 'Cover máy & tủ điện', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80' },
  { name: 'Bàn ghế inox theo yêu cầu', slug: 'ban-ghe-inox-theo-yeu-cau', sku: 'DK-NT-024', category: 'Nội thất inox', priceOnRequest: true, unit: 'bộ', stock: 0, image: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=900&q=80' }
);

const leads = [
  { name: 'Nguyễn Văn Minh', phone: '0912345678', email: 'minh@example.com', serviceType: 'Gia công cơ khí', budget: '100 - 500 triệu', message: 'Cần gia công cụm chi tiết theo bản vẽ kỹ thuật.', status: 'new', source: 'seed' },
  { name: 'Trần Hoàng Nam', phone: '0987654321', email: 'nam@example.com', serviceType: 'Thi công công nghiệp', budget: '500 triệu - 2 tỷ', message: 'Yêu cầu khảo sát và báo giá kết cấu nhà xưởng.', status: 'contacted', source: 'seed' },
  { name: 'Công ty An Phát', phone: '0905123456', email: 'purchasing@anphat.example', serviceType: 'Cung ứng thiết bị', budget: 'Trên 2 tỷ', message: 'Cần báo giá thiết bị cho dây chuyền sản xuất mới.', status: 'quoted', source: 'seed' }
];

async function seed() {
  await connectDatabase();
  await Promise.all([Product.deleteMany({}), Project.deleteMany({}), Service.deleteMany({}), Lead.deleteMany({ source: 'seed' })]);
  const [createdProducts, createdProjects, createdServices, createdLeads] = await Promise.all([
    Product.insertMany(products),
    Project.insertMany(projects),
    Service.insertMany(services),
    Lead.insertMany(leads)
  ]);
  const adminStatus = await bootstrapAdmin();
  console.log(`Seed complete: ${createdProducts.length} products, ${createdProjects.length} projects, ${createdServices.length} services, ${createdLeads.length} leads`);
  console.log(`Admin account: ${adminStatus}`);
  process.exit(0);
}
seed().catch(error => { console.error(error); process.exit(1); });
