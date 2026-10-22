import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';

const sampleProducts = [
  // --- Audio ---
  {
    name: 'PulsePro Wireless Noise-Cancelling Headphones',
    description:
      'Immerse yourself in rich, high-fidelity acoustics with active noise cancellation, 40-hour battery life, plush memory-foam ear cushions, and transparency mode for crystal clear calls.',
    category: 'Audio',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    stock: 25,
    rating: 4.8,
    numReviews: 142,
  },
  {
    name: 'SonicWave True Wireless Earbuds with ANC',
    description:
      'Compact earbuds delivering deep punchy bass, IPX5 water resistance, wireless Qi charging, and dual beamforming microphones with environment noise cancellation.',
    category: 'Audio',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    stock: 40,
    rating: 4.6,
    numReviews: 98,
  },
  {
    name: 'StudioBeat 360° Portable Bluetooth Speaker',
    description:
      'Rugged IP67 dustproof and waterproof speaker with omnidirectional sound, rich subwoofers, customizable RGB rhythm lighting, and 24 hours of non-stop playback.',
    category: 'Audio',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    rating: 4.7,
    numReviews: 64,
  },

  // --- Wearables ---
  {
    name: 'Apex Fit Pro Smartwatch (AMOLED Display)',
    description:
      'Precision fitness companion equipped with a vibrant 1.43-inch AMOLED display, continuous SpO2 and heart-rate tracking, 110+ sports modes, Bluetooth calling, and 12-day battery life.',
    category: 'Wearables',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    stock: 30,
    rating: 4.9,
    numReviews: 215,
  },
  {
    name: 'Horizon GPS Multisport Rugged Watch',
    description:
      'Military-grade durability with dual-frequency GNSS positioning, barometric altimeter, offline topographic maps, and titanium bezel designed for the most demanding trails.',
    category: 'Wearables',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
    stock: 18,
    rating: 4.7,
    numReviews: 76,
  },
  {
    name: 'Aura Smart Titanium Sleep & Recovery Ring',
    description:
      'Ultralight medical-grade titanium ring monitoring heart rate variability (HRV), skin temperature, sleep stages, and readiness score with zero subscription fees.',
    category: 'Wearables',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    stock: 10,
    rating: 4.5,
    numReviews: 39,
  },

  // --- Electronics ---
  {
    name: 'UltraView 4K UHD HDR Web Camera',
    description:
      'Broadcast-quality 4K streaming webcam with Sony STARVIS sensor, intelligent auto-framing, dual noise-reducing stereo microphones, and physical privacy shutter.',
    category: 'Electronics',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=800&q=80',
    stock: 22,
    rating: 4.6,
    numReviews: 83,
  },
  {
    name: 'Lumina RGB Mechanical Gaming Keyboard (Hot-Swap)',
    description:
      'Aircraft-grade aluminum chassis with hot-swappable linear yellow switches, PBT double-shot keycaps, per-key RGB backlighting, and detachable braided USB-C cable.',
    category: 'Electronics',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    stock: 35,
    rating: 4.8,
    numReviews: 120,
  },
  {
    name: 'PrecisionMaster Wireless Ergonomic Mouse',
    description:
      'Sculpted ergonomic design with quiet click switches, hyper-fast MagSpeed scrolling wheel, multi-device Bluetooth/2.4GHz connectivity, and USB-C quick recharge.',
    category: 'Electronics',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    stock: 50,
    rating: 4.7,
    numReviews: 175,
  },
  {
    name: 'PowerStream 100W GaN III Fast Charger',
    description:
      'Next-generation Gallium Nitride (GaN) desktop charging station with 3x USB-C PD 3.0 ports and 1x USB-A port capable of fast-charging laptops, tablets, and phones simultaneously.',
    category: 'Electronics',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    stock: 45,
    rating: 4.9,
    numReviews: 92,
  },

  // --- Photography ---
  {
    name: 'CinePro 3-Axis Handheld Smartphone Gimbal',
    description:
      'Cinema-smooth video stabilization with built-in extendable selfie rod, AI face/object tracking, magnetic quick-release clamp, and gesture controls for content creators.',
    category: 'Photography',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    stock: 12,
    rating: 4.6,
    numReviews: 44,
  },
  {
    name: 'ApexCapture 4K Action Camera with Dual Screens',
    description:
      'Rugged waterproof action camera shooting 4K/60fps video with 6-axis electronic image stabilization, front selfie screen, and voice control.',
    category: 'Photography',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
    stock: 8,
    rating: 4.7,
    numReviews: 61,
  },

  // --- Accessories & Everyday Carry ---
  {
    name: 'UrbanShield Water-Resistant Laptop Backpack',
    description:
      'Weatherproof ballistic nylon commuter backpack with dedicated 16-inch padded laptop sleeve, hidden anti-theft RFID pocket, and integrated USB charging port.',
    category: 'Accessories',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    stock: 20,
    rating: 4.8,
    numReviews: 110,
  },
  {
    name: 'Titanium Minimalist RFID-Blocking Wallet',
    description:
      'Ultra-slim space-grade titanium cardholder holding up to 12 cards and cash with elastic cash strap and certified RFID blocking protection.',
    category: 'Accessories',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    stock: 3, // Low stock indicator test
    rating: 4.4,
    numReviews: 29,
  },
  {
    name: 'AeroGrip Magnetic MagSafe Desktop Stand',
    description:
      'Machined solid aluminum desktop phone stand with 360-degree ball joint and ultra-strong N52 neodymium magnets for portrait and landscape viewing.',
    category: 'Accessories',
    pricePaise: 100, // ₹1.00
    imageUrl:
      'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=800&q=80',
    stock: 0, // Out of stock indicator test
    rating: 4.3,
    numReviews: 15,
  },
];

async function seedDatabase() {
  try {
    console.log('[SEED] Connecting to MongoDB...');
    await connectDB();

    console.log('[SEED] Clearing existing products collection...');
    await Product.deleteMany({});

    console.log(`[SEED] Inserting ${sampleProducts.length} realistic sample products at 100 paise (₹1.00)...`);
    const inserted = await Product.create(sampleProducts);

    console.log(`[SEED SUCCESS] Successfully seeded ${inserted.length} products!`);
    console.log('[SEED] Categories seeded:');
    const categories = await Product.distinct('category');
    console.log(' -', categories.join(', '));

    console.log('\n[SEED] Seeding demo user accounts...');
    await User.deleteMany({});

    const adminPasswordHash = await User.hashPassword('Admin@12345');
    const customerPasswordHash = await User.hashPassword('Customer@12345');

    const adminUser = await User.create({
      name: 'ShopSphere Admin',
      email: 'admin@shopsphere.dev',
      passwordHash: adminPasswordHash,
      role: 'admin',
    });

    const customerUser = await User.create({
      name: 'Aadit Customer',
      email: 'customer@shopsphere.dev',
      passwordHash: customerPasswordHash,
      role: 'customer',
    });

    console.log('[SEED SUCCESS] Demo users created:');
    console.log(`  Admin    : admin@shopsphere.dev (Password: Admin@12345) -> role: ${adminUser.role}`);
    console.log(`  Customer : customer@shopsphere.dev (Password: Customer@12345) -> role: ${customerUser.role}`);

    process.exit(0);
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
