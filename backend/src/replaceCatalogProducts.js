require('dotenv').config();
const connectDatabase = require('./config/database');
const Product = require('./models/Product');
const { catalogProducts } = require('./catalogProducts');

async function replaceCatalogProducts() {
  await connectDatabase();
  const slugs = catalogProducts.map(product => product.slug);
  const retired = await Product.updateMany(
    { slug: { $nin: slugs }, deletedAt: null },
    { $set: { active: false, featured: false, deletedAt: new Date() }, $unset: { sku: '' } }
  );
  for (const product of catalogProducts) {
    await Product.findOneAndUpdate(
      { slug: product.slug },
      { $set: { ...product, deletedAt: null } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  const visible = await Product.countDocuments({ active: true, deletedAt: null });
  console.log(`Catalog updated: ${visible} public products, ${retired.modifiedCount} sample products hidden`);
  process.exit(0);
}

replaceCatalogProducts().catch(error => {
  console.error(error.message);
  process.exit(1);
});
