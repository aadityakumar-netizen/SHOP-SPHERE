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

async function runPaymentTests() {
  console.log('--- Starting Phase 5 Payment & Webhook Verification Test Suite ---');

  // 1. Customer Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@shopsphere.dev', password: 'Customer@12345' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log('✓ 1. Customer authenticated successfully');

  // 2. Fetch sample product and create MongoDB order
  const prodRes = await fetch(`${BASE_URL}/products?limit=1`);
  const prodData = await prodRes.json();
  const product = prodData.products[0];

  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      items: [{ productId: product._id, quantity: 1 }],
      shippingAddress: {
        fullName: 'Aadit Customer',
        phone: '9876543210',
        street: '123 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      },
    }),
  });
  const orderData = await orderRes.json();
  const orderId = orderData.order._id;
  console.log(`✓ 2. Created pending order: ${orderId} (Amount: ${orderData.order.totalAmountPaise} paise)`);

  // 3. Create Razorpay Order
  const createRzpRes = await fetch(`${BASE_URL}/payments/create-order`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ orderId }),
  });
  const rzpData = await createRzpRes.json();
  const razorpayOrderId = rzpData.razorpayOrderId;
  console.log(`✓ 3. Initialized Razorpay order: ${razorpayOrderId}`);

  // 3a. Verify Key ID is Test Mode, currency is INR, and amount matches integer paise
  if (rzpData.keyId.startsWith('rzp_live_')) {
    throw new Error('Security failure: Live mode key detected in payment initialization!');
  }
  if (rzpData.currency !== 'INR') {
    throw new Error(`Currency failure: Expected INR, got ${rzpData.currency}`);
  }
  if (rzpData.amount !== orderData.order.totalAmountPaise) {
    throw new Error(`Amount mismatch: Expected ${orderData.order.totalAmountPaise} paise, got ${rzpData.amount}`);
  }
  console.log(`✓ 3a. Verified Test Mode key (${rzpData.keyId}), currency (INR), and integer paise (${rzpData.amount})`);

  // 4a. Test Mismatched Razorpay Order ID (Must fail with order_mismatch)
  const fakePaymentId = 'pay_test_998877665544';
  const mismatchedVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      orderId,
      razorpayOrderId: 'order_test_mismatched_99999',
      razorpayPaymentId: fakePaymentId,
      razorpaySignature: 'invalid_sig',
    }),
  });
  const mismatchedData = await mismatchedVerifyRes.json();
  if (!mismatchedData.success && mismatchedData.verificationStatus === 'order_mismatch') {
    console.log('✓ 4a. Security Check: Order ID mismatch was REJECTED with order_mismatch status');
  } else {
    throw new Error('Security failure: Mismatched order ID was not rejected with order_mismatch!');
  }

  // 4b. Test Invalid HMAC-SHA256 Signature (Must Fail and NOT mark order paid)
  const invalidSignature = 'invalid_tampered_signature_1234567890abcdef';

  const invalidVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      orderId,
      razorpayOrderId,
      razorpayPaymentId: fakePaymentId,
      razorpaySignature: invalidSignature,
    }),
  });
  const invalidData = await invalidVerifyRes.json();
  if (!invalidData.success && invalidVerifyRes.status === 400 && invalidData.verificationStatus === 'signature_invalid') {
    console.log('✓ 4b. Security Check: Invalid signature was REJECTED with 400 Bad Request and signature_invalid');
  } else {
    throw new Error('Security failure: Invalid signature was accepted!');
  }

  // 5. Test Valid HMAC-SHA256 Signature
  const validPaymentId = 'pay_test_' + Date.now();
  const payloadToSign = `${razorpayOrderId}|${validPaymentId}`;
  const validSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(payloadToSign)
    .digest('hex');

  const validVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      orderId,
      razorpayOrderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature,
    }),
  });
  const validData = await validVerifyRes.json();
  if (validData.success && validData.order.paymentStatus === 'paid') {
    console.log(`✓ 5. Valid signature verified! Order status updated to PAID (orderStatus: ${validData.order.orderStatus})`);
  } else {
    throw new Error('Valid signature verification failed: ' + JSON.stringify(validData));
  }

  // 6. Test Idempotency (Submitting valid payment verification a second time)
  const duplicateVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      orderId,
      razorpayOrderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature,
    }),
  });
  const duplicateData = await duplicateVerifyRes.json();
  if (duplicateData.success && duplicateData.message.includes('idempotent')) {
    console.log('✓ 6. Idempotency Check: Duplicate payment verification safely handled without duplicate mutations');
  } else {
    throw new Error('Idempotency failure: ' + JSON.stringify(duplicateData));
  }

  // 6b. Test Diagnostic Payment Failure Logging with sensitive card sanitization
  const logFailureRes = await fetch(`${BASE_URL}/payments/log-failure`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      orderId,
      razorpayOrderId,
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: 'Order id is not valid. Simulated sensitive card: 4111-1111-1111-1111 cvv 123',
      errorSource: 'gateway',
      errorStep: 'payment_initiation',
      errorReason: 'payment_failed',
      razorpayPaymentId: 'pay_failed_sample',
    }),
  });
  const logFailureData = await logFailureRes.json();
  if (
    logFailureRes.status === 200 &&
    logFailureData.diagnosticLogged === true &&
    !logFailureData.sanitizedMessage.includes('4111-1111-1111-1111') &&
    !logFailureData.sanitizedMessage.includes('123')
  ) {
    console.log('✓ 6b. Diagnostics Check: Failure logged safely with sensitive card/CVV data redacted');
  } else {
    throw new Error('Diagnostics failure: Failed to log failure or sensitive numbers were leaked!');
  }

  // 7. Create a second order to test Webhook handling
  const orderRes2 = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      items: [{ productId: product._id, quantity: 1 }],
      shippingAddress: {
        fullName: 'Aadit Webhook Customer',
        phone: '9876543210',
        street: '456 Residency Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560025',
      },
    }),
  });
  const orderData2 = await orderRes2.json();
  const orderId2 = orderData2.order._id;
  // Update order with the razorpayOrderId
  const createRzpRes2 = await fetch(`${BASE_URL}/payments/create-order`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ orderId: orderId2 }),
  });
  const createRzpData2 = await createRzpRes2.json();
  const webhookRzpOrderId = createRzpData2.razorpayOrderId;

  // 8. Test Webhook with Invalid Signature
  const webhookBodyString = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_wh_' + Date.now(),
          order_id: webhookRzpOrderId,
          status: 'captured',
        },
      },
    },
  });

  const invalidWhRes = await fetch(`${BASE_URL}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': 'invalid_webhook_sig',
    },
    body: webhookBodyString,
  });
  if (invalidWhRes.status === 400) {
    console.log('✓ 8. Webhook Security: Invalid webhook signature was REJECTED with 400 Bad Request');
  } else {
    throw new Error('Webhook security failure: Invalid webhook signature was accepted!');
  }

  // 9. Test Webhook with Valid HMAC-SHA256 Signature (Raw Body Verification)
  const validWhSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(webhookBodyString)
    .digest('hex');

  const eventId = 'evt_' + Date.now();
  const validWhRes = await fetch(`${BASE_URL}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validWhSignature,
      'x-razorpay-event-id': eventId,
    },
    body: webhookBodyString,
  });
  const validWhData = await validWhRes.json();
  if (validWhData.success && validWhData.received) {
    console.log('✓ 9. Valid Webhook: Ingested and verified against raw request body');
  } else {
    throw new Error('Valid webhook ingestion failed: ' + JSON.stringify(validWhData));
  }

  // 10. Test Duplicate Webhook Event Delivery (Idempotent Deduplication)
  const duplicateWhRes = await fetch(`${BASE_URL}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validWhSignature,
      'x-razorpay-event-id': eventId,
    },
    body: webhookBodyString,
  });
  const duplicateWhData = await duplicateWhRes.json();
  if (duplicateWhData.success && duplicateWhData.message.includes('idempotent')) {
    console.log('✓ 10. Webhook Idempotency: Duplicate event delivery safely deduplicated and ignored');
  } else {
    throw new Error('Webhook deduplication failure: ' + JSON.stringify(duplicateWhData));
  }

  // Verify that order2 was marked paid by the webhook
  const checkOrder2Res = await fetch(`${BASE_URL}/orders/${orderId2}`, {
    headers: authHeaders,
  });
  const checkOrder2Data = await checkOrder2Res.json();
  if (checkOrder2Data.order.paymentStatus === 'paid') {
    console.log(`✓ 11. Asynchronous confirmation: Order ${orderId2} was marked PAID by the webhook!`);
  } else {
    throw new Error('Order was not marked paid by webhook');
  }

  console.log('\n--- ALL PHASE 5 TESTS PASSED WITH 100% SUCCESS ---');
}

runPaymentTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err.message);
  process.exit(1);
});
