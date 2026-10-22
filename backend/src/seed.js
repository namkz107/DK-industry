require('dotenv').config();
const connectDatabase = require('./config/database');
const Product = require('./models/Product');
const Project = require('./models/Project');
const Lead = require('./models/Lead');
const Service = require('./models/Service');
const bootstrapAdmin = require('./services/bootstrapAdmin');
const { services, projects } = require('./catalog');
const { catalogProducts: products } = require('./catalogProducts');

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
