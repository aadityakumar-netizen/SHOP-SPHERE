import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Product from '../src/models/Product.js';

async function updateProductPrices() {
  try {
    console.log('[MIGRATION] Connecting to MongoDB...');
    await connectDB();

    console.log('[MIGRATION] Scanning products collection...');
    const totalCount = await Product.countDocuments({});
    console.log(`[MIGRATION] Found ${totalCount} existing products.`);

    if (totalCount === 0) {
      console.log('[MIGRATION] No products found to update.');
      process.exit(0);
    }

    // Safely update all active products to 100 paise (₹1.00) without touching users or orders
    const result = await Product.updateMany(
      {},
      { $set: { pricePaise: 100 } }
    );

    console.log(`[MIGRATION SUCCESS] Updated ${result.modifiedCount} products to 100 paise (₹1.00).`);

    // Verification check
    const nonOneRupeeProducts = await Product.countDocuments({ pricePaise: { $ne: 100 } });
    if (nonOneRupeeProducts === 0) {
      console.log('✓ Verification PASSED: 100% of products in MongoDB Atlas/local DB are now priced at 100 paise (₹1.00).');
    } else {
      console.warn(`[WARN] ${nonOneRupeeProducts} products still have non-100 paise price.`);
    }

    const sample = await Product.find({}, 'name pricePaise category stock').limit(5).lean();
    console.log('\n[MIGRATION] Sample updated records:');
    sample.forEach((p) => {
      console.log(` - ${p.name} (${p.category}): ${p.pricePaise} paise (₹${(p.pricePaise / 100).toFixed(2)})`);
    });

    console.log('\n[MIGRATION] Users and orders were NOT touched.');
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATION ERROR] Failed to update product prices:', error);
    process.exit(1);
  }
}

updateProductPrices();
