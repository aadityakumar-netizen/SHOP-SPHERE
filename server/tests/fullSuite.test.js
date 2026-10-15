import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api/v1';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'placeholder_key_secret';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_webhook_secret';

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

async function runComprehensiveTests() {
  console.log('===============================================================');
  console.log('  ShopSphere Full-Stack Automated Test Suite (Phases 1-6)       ');
  console.log('===============================================================');

  // --- 1. System Health ---
  console.log('\n[1. System Diagnostics & Health Check]');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200, 'Health endpoint returns HTTP 200 OK');
  assert(healthData.success === true, 'Service reports healthy status');
  assert(healthData.database?.status === 'connected', 'Database connection readyState is connected');

  // --- 2. Authentication & Input Validation ---
  console.log('\n[2. Authentication & Authorization Guards]');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const testEmail = `testuser_${randomSuffix}@shopsphere.dev`;

  // Invalid registration (password too short)
  const shortPassRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Short Pass', email: testEmail, password: '123' }),
  });
  assert(shortPassRes.status === 400, 'Validation: Rejects password under 6 chars with HTTP 400');

  // Valid registration
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: testEmail, password: 'ValidPassword123' }),
  });
  const regData = await regRes.json();
  assert(regRes.status === 201, 'Registration: Creates new customer account with HTTP 201');
  assert(regData.user?.role === 'customer', 'Registration: Assigns customer role (prevents escalation)');
  assert(Boolean(regData.token), 'Registration: Returns signed JWT token');

  // Duplicate email rejection
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User Duplicate', email: testEmail, password: 'ValidPassword123' }),
  });
  assert(dupRes.status === 409, 'Duplicate Guard: Rejects already registered email with HTTP 409 Conflict');

  // Customer Login
  const custLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@shopsphere.dev', password: 'Customer@12345' }),
  });
  const custLoginData = await custLoginRes.json();
  assert(custLoginRes.status === 200, 'Login: Authenticates customer with correct password');
  const custToken = custLoginData.token;
  const custHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${custToken}`,
  };

  // Admin Login
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@shopsphere.dev', password: 'Admin@12345' }),
  });
  const adminLoginData = await adminLoginRes.json();
  assert(adminLoginRes.status === 200, 'Login: Authenticates administrator');
  const adminToken = adminLoginData.token;
  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  // RBAC check: Customer accessing admin endpoint
  const rbacRes = await fetch(`${BASE_URL}/admin/stats`, { headers: custHeaders });
  assert(rbacRes.status === 403, 'RBAC Guard: Customer blocked from /admin/stats with HTTP 403 Forbidden');

  // Admin accessing admin endpoint
  const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, { headers: adminHeaders });
  assert(adminStatsRes.status === 200, 'RBAC Access: Administrator granted access to /admin/stats');

  // --- 3. Product Catalog, Search & Filtering ---
  console.log('\n[3. Product Catalogue, Search & Pagination]');
  const prodsRes = await fetch(`${BASE_URL}/products?limit=5`);
  const prodsData = await prodsRes.json();
  assert(prodsData.products?.length > 0, 'Catalog: Returns active products');
  assert(Number.isInteger(prodsData.products[0].pricePaise), 'Integer Math: Product price stored as whole integer paise');

  const searchRes = await fetch(`${BASE_URL}/products?search=ANC`);
  const searchData = await searchRes.json();
  assert(searchData.products?.length > 0, 'Search: Finds matching products by search keyword');

  const catRes = await fetch(`${BASE_URL}/products/categories`);
  const catData = await catRes.json();
  assert(catData.categories?.length >= 4, 'Categories: Distinct category list retrieved');

  // --- 4. Cart & Server-Side Price Calculations ---
  console.log('\n[4. Cart Validation & Server-Side Pricing]');
  const sampleProduct = prodsData.products[0];
  const initialStock = sampleProduct.stock;

  const cartValRes = await fetch(`${BASE_URL}/orders/validate-cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: sampleProduct._id, quantity: 2 }],
    }),
  });
  const cartValData = await cartValRes.json();
  assert(cartValData.isValid === true, 'Cart: Successfully validates stock and prices against MongoDB');
  assert(
    cartValData.subtotalPaise === sampleProduct.pricePaise * 2,
    'Pricing: Server calculates subtotal in integer paise'
  );

  // --- 5. Order Creation & Atomic Stock Reservation ---
  console.log('\n[5. Order Creation & Atomic Stock Decrement]');
  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: custHeaders,
    body: JSON.stringify({
      items: [{ productId: sampleProduct._id, quantity: 2 }],
      shippingAddress: {
        fullName: 'Aadit Customer',
        phone: '9876543210',
        street: '100 Innovation Way',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      },
    }),
  });
  const orderData = await orderRes.json();
  assert(orderRes.status === 201, 'Order: Creates pending order with HTTP 201');
  assert(orderData.order.paymentStatus === 'pending', 'Order: Initializes with paymentStatus: "pending"');
  assert(orderData.order.orderStatus === 'placed', 'Order: Initializes with orderStatus: "placed"');

  const orderId = orderData.order._id;

  // Verify stock decremented
  const checkStockRes = await fetch(`${BASE_URL}/products/${sampleProduct._id}`);
  const checkStockData = await checkStockRes.json();
  assert(
    checkStockData.product.stock === initialStock - 2,
    `Inventory: Stock atomically decremented from ${initialStock} to ${initialStock - 2}`
  );

  // Overselling protection
  const oversellRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: custHeaders,
    body: JSON.stringify({
      items: [{ productId: sampleProduct._id, quantity: 999999 }],
      shippingAddress: {
        fullName: 'Test',
        phone: '9876543210',
        street: 'Street',
        city: 'City',
        state: 'State',
        postalCode: '560001',
      },
    }),
  });
  assert(oversellRes.status === 400, 'Inventory Guard: Overselling request rejected with HTTP 400 Bad Request');

  // Customer order isolation: User 2 cannot access User 1's order
  const otherUserRes = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${regData.token}` },
  });
  assert(otherUserRes.status === 403, 'Data Isolation: Customer cannot view another customer order (HTTP 403)');

  // --- 6. Razorpay Payment Lifecycle & Cryptographic Signature Verification ---
  console.log('\n[6. Razorpay Test Mode & HMAC-SHA256 Signature Verification]');

  // Initialize Razorpay order
  const rzpOrderRes = await fetch(`${BASE_URL}/payments/create-order`, {
    method: 'POST',
    headers: custHeaders,
    body: JSON.stringify({ orderId }),
  });
  const rzpOrderData = await rzpOrderRes.json();
  assert(rzpOrderRes.status === 200, 'Razorpay: Order created and razorpayOrderId attached to MongoDB record');
  const razorpayOrderId = rzpOrderData.razorpayOrderId;

  // Invalid signature rejection
  const invalidVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: custHeaders,
    body: JSON.stringify({
      orderId,
      razorpayOrderId,
      razorpayPaymentId: 'pay_tampered_123',
      razorpaySignature: 'tampered_signature_hex_1234567890abcdef',
    }),
  });
  assert(invalidVerifyRes.status === 400, 'Security Guard: Tampered payment signature rejected with HTTP 400');

  // Valid HMAC-SHA256 signature
  const validPaymentId = 'pay_fullsuite_' + Date.now();
  const validSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${razorpayOrderId}|${validPaymentId}`)
    .digest('hex');

  const validVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: custHeaders,
    body: JSON.stringify({
      orderId,
      razorpayOrderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature,
    }),
  });
  const validVerifyData = await validVerifyRes.json();
  assert(validVerifyRes.status === 200, 'Payment Verification: Valid HMAC-SHA256 signature verified');
  assert(validVerifyData.order.paymentStatus === 'paid', 'Payment State: Order marked as PAID in MongoDB');
  assert(validVerifyData.order.orderStatus === 'processing', 'Fulfillment State: Order transitioned to PROCESSING');

  // Idempotent payment verification (duplicate request)
  const dupVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: custHeaders,
    body: JSON.stringify({
      orderId,
      razorpayOrderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature,
    }),
  });
  const dupVerifyData = await dupVerifyRes.json();
  assert(dupVerifyRes.status === 200, 'Idempotency: Duplicate payment verification returns HTTP 200 without mutations');

  // --- 7. Razorpay Webhooks (Raw Body Verification & Deduplication) ---
  console.log('\n[7. Razorpay Webhooks (Raw Body HMAC & Deduplication)]');
  const webhookPayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_wh_test_' + Date.now(),
          order_id: razorpayOrderId,
          status: 'captured',
        },
      },
    },
  });

  const webhookSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(webhookPayload)
    .digest('hex');

  const eventId = 'evt_test_' + Date.now();

  const whRes = await fetch(`${BASE_URL}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': webhookSignature,
      'x-razorpay-event-id': eventId,
    },
    body: webhookPayload,
  });
  assert(whRes.status === 200, 'Webhook: Raw request body HMAC-SHA256 signature verified');

  // Duplicate webhook delivery
  const dupWhRes = await fetch(`${BASE_URL}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': webhookSignature,
      'x-razorpay-event-id': eventId,
    },
    body: webhookPayload,
  });
  const dupWhData = await dupWhRes.json();
  assert(dupWhRes.status === 200 && dupWhData.message?.includes('idempotent'), 'Webhook Idempotency: Duplicate event delivery safely deduplicated');

  // --- 8. Order Fulfillment State Machine ---
  console.log('\n[8. Order Fulfillment State Machine]');
  // Valid: processing -> shipped
  const shipRes = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'shipped' }),
  });
  assert(shipRes.status === 200, 'State Machine: Valid transition "processing" -> "shipped" allowed');

  // Valid: shipped -> delivered
  const deliverRes = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'delivered' }),
  });
  assert(deliverRes.status === 200, 'State Machine: Valid transition "shipped" -> "delivered" allowed');

  // Illegal: delivered -> placed (backward transition)
  const illegalRes = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'placed' }),
  });
  assert(illegalRes.status === 400, 'State Machine Guard: Illegal backward transition "delivered" -> "placed" REJECTED (HTTP 400)');

  console.log('\n===============================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED                 `);
  console.log('===============================================================');
}

runComprehensiveTests().catch((err) => {
  console.error('\n❌ Test Suite Aborted:', err);
  process.exit(1);
});
