import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api/v1';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  }
}

async function runOneRupeePricingTest() {
  console.log('===============================================================');
  console.log('  ShopSphere ₹1.00 Pricing & Order Verification Test Suite       ');
  console.log('===============================================================');

  // 1. Authenticate Customer
  console.log('\n[1. Customer Authentication]');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@shopsphere.dev', password: 'Customer@12345' }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, 'Customer authenticated successfully');
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Verify all active products in catalog have pricePaise === 100 (₹1.00)
  console.log('\n[2. Product Catalog ₹1.00 (100 Paise) Verification]');
  const prodRes = await fetch(`${BASE_URL}/products?limit=20`);
  const prodData = await prodRes.json();
  assert(prodData.products && prodData.products.length > 0, 'Products retrieved from API');

  const allOneRupee = prodData.products.every((p) => p.pricePaise === 100);
  assert(allOneRupee, `Every active catalog product has pricePaise === 100 (Checked ${prodData.products.length} products)`);

  const sampleProduct = prodData.products[0];
  console.log(`  Sample product: "${sampleProduct.name}" -> ${sampleProduct.pricePaise} paise (₹${(sampleProduct.pricePaise / 100).toFixed(2)})`);

  // 3. Cart Validation for 1 item at ₹1.00
  console.log('\n[3. Cart Validation for 1 unit]');
  const cartValRes = await fetch(`${BASE_URL}/orders/validate-cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: sampleProduct._id, quantity: 1 }],
    }),
  });
  const cartValData = await cartValRes.json();
  assert(cartValData.isValid === true, 'Cart validation succeeds for ₹1 product');
  assert(cartValData.subtotalPaise === 100, `Cart subtotal is strictly 100 paise (Received: ${cartValData.subtotalPaise})`);
  assert(cartValData.totalAmountPaise === 100, `Cart total with 0 additional charges is 100 paise (Received: ${cartValData.totalAmountPaise})`);

  // 4. Create New Order for 1 item at ₹1.00
  console.log('\n[4. Create Order for 1 item at ₹1.00]');
  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      items: [{ productId: sampleProduct._id, quantity: 1 }],
      shippingAddress: {
        fullName: 'Test Shopper',
        phone: '9876543210',
        street: '42 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      },
    }),
  });
  const orderData = await orderRes.json();
  assert(orderRes.status === 201, 'Order created with HTTP 201');
  const order = orderData.order;
  assert(order.subtotalPaise === 100, `Order subtotal is exactly 100 paise (₹1.00)`);
  assert(order.shippingPaise === 0, `Order shipping fee is 0 paise (no additional charges)`);
  assert(order.totalAmountPaise === 100, `Order grand total is exactly 100 paise (₹1.00)`);
  assert(order.orderItems[0].pricePaise === 100, `Order line item pricePaise snapshot is 100`);
  assert(order.orderItems[0].lineTotalPaise === 100, `Order line item lineTotalPaise is 100`);

  // 5. Create Razorpay Order and verify 100 paise
  console.log('\n[5. Razorpay Test Order Amount Verification]');
  const rzpRes = await fetch(`${BASE_URL}/payments/create-order`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ orderId: order._id }),
  });
  const rzpData = await rzpRes.json();
  assert(rzpRes.status === 200, 'Razorpay order created with HTTP 200');
  assert(rzpData.amount === 100, `Razorpay order amount is exactly 100 paise (₹1.00) (Received: ${rzpData.amount})`);
  assert(rzpData.currency === 'INR', 'Razorpay currency is INR');
  assert(Boolean(rzpData.razorpayOrderId), `Razorpay order ID generated: ${rzpData.razorpayOrderId}`);

  // 6. Multi-unit calculation verification (e.g. 3 units = 300 paise)
  console.log('\n[6. Multi-unit Calculation Verification]');
  const multiCartRes = await fetch(`${BASE_URL}/orders/validate-cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: sampleProduct._id, quantity: 3 }],
    }),
  });
  const multiCartData = await multiCartRes.json();
  assert(multiCartData.subtotalPaise === 300, `3 units at ₹1.00 = 300 paise (₹3.00)`);
  assert(multiCartData.totalAmountPaise === 300, `Total amount for 3 units = 300 paise (₹3.00)`);

  console.log('\n===============================================================');
  console.log(`  ALL ₹1.00 PRICING TESTS PASSED! (${passed} checks succeeded)  `);
  console.log('===============================================================');
  process.exit(0);
}

runOneRupeePricingTest().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
