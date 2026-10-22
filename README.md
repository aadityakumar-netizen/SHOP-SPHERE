# ShopSphere — MERN Stack E-Commerce Platform

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%26%20Mongoose-47A248.svg)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test%20Mode-0C2340.svg)](https://razorpay.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

**ShopSphere** is a high-standard, placement-ready full-stack e-commerce application built with the **MERN** stack (MongoDB Atlas, Express.js, React + Vite, Node.js) and official **Razorpay Test Mode** payment integration.

It was designed from scratch to solve real-world engineering and financial accuracy challenges: preventing floating-point rounding errors via integer paise calculations, stopping inventory overselling via atomic MongoDB conditional mutations, verifying checkout payments via timing-safe HMAC-SHA256 comparisons, and handling asynchronous webhooks idempotently with raw request body capture.

---

## Architecture & Engineering Highlights

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        SHOPSPHERE ARCHITECTURE                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

  [ React 18 + Vite + Tailwind Client ] (Port 5173)
         â”‚
         â”‚  1. Axios with JWT Bearer Interceptor
         â–¼
  [ Express.js REST API v1 ] (Port 5000)
         â”‚  â”œâ”€â”€ Helmet (Security Headers)
         â”‚  â”œâ”€â”€ CORS (Configured Origins)
         â”‚  â”œâ”€â”€ Express Rate Limit (Auth: 30/15m, Payments: 60/15m)
         â”‚  â”œâ”€â”€ express.json with rawBody verification capture
         â”‚
         â”œâ”€â”€â–º [ MongoDB Atlas / Local MongoDB ]
         â”‚       â”œâ”€â”€ User (Bcrypt passwordHash, RBAC: customer | admin)
         â”‚       â”œâ”€â”€ Product (Integer pricePaise, auto-slug, text index)
         â”‚       â”œâ”€â”€ Order (Integer subtotal/shipping/total, items snapshot)
         â”‚       â””â”€â”€ WebhookEvent (Deduplication eventId, audit trail)
         â”‚
         â”œâ”€â”€â–º [ Official Razorpay Node.js SDK (Test Mode) ]
         â”‚       â”œâ”€â”€ Orders API (orders.create in integer paise)
         â”‚       â””â”€â”€ HMAC-SHA256 Timing-Safe Signature Verification
         â”‚
         â””â”€â”€â–º [ Razorpay Webhook Ingestion ]
                 â””â”€â”€ Verified against rawBody Buffer + Idempotent deduplication
```

### 1. Financial Accuracy: Integer Paise Math
JavaScript's `Number` is an IEEE 754 double-precision float (e.g., `0.1 + 0.2 === 0.30000000000000004`). In e-commerce payments, fractional paise or floating-point rounding discrepancies can cause payment gateways to reject orders or create accounting reconciliation errors.
- **Rule**: All prices, subtotals, shipping fees, and totals are computed and stored as **whole integer paise** (`1 INR = 100 paise`).
- Example: `â‚¹1,499.00` is strictly stored as `149900` paise.
- Currency display helpers (`formatCurrency`) divide by 100 only at the UI boundary.

### 2. Server-Authoritative Pricing
Browser clients only submit `{ productId, quantity }` and shipping details. The backend queries MongoDB directly for the current price and stock. Client-submitted prices, discounts, or totals are completely ignored to eliminate parameter tampering.

### 3. Atomic Stock Reservation (Preventing Overselling)
When an order is created, the server reserves inventory using atomic MongoDB conditional updates:
```javascript
Product.findOneAndUpdate(
  { _id: item.productId, stock: { $gte: item.quantity }, isActive: true },
  { $inc: { stock: -item.quantity } },
  { new: true }
);
```
If an item's stock is depleted concurrently by another customer between cart view and order submission, the operation fails cleanly and safely rolls back all previously decremented items.

### 4. Cryptographic HMAC-SHA256 Signature Verification
Payment success is never trusted solely because the browser reports a success callback:
1. Razorpay Checkout returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
2. The backend recomputes `HMAC-SHA256(razorpay_order_id + '|' + razorpay_payment_id, RAZORPAY_KEY_SECRET)`.
3. It compares the computed hash with the received signature using `crypto.timingSafeEqual` (preventing timing attacks).
4. The order is only marked `paid` if the signature is valid and the order matches the Razorpay order ID.

### 5. Idempotent Webhooks & Raw Request Body Buffer
Razorpay webhooks calculate their signature over the raw HTTP request body string:
- If standard JSON parsing reformats whitespaces, verification fails.
- `server/src/app.js` captures `req.rawBody = buf` during JSON parsing.
- Incoming webhook deliveries are checked against the `WebhookEvent` collection by `eventId`. Duplicate deliveries are acknowledged with HTTP 200 without executing duplicate mutations.

### 6. Order Fulfillment State Machine
Order payment status (`pending`, `paid`, `failed`) is decoupled from order fulfillment status:
- Permitted transitions: `placed` &rarr; `processing` &rarr; `shipped` &rarr; `delivered`
- Cancellation transition: `placed` or `processing` &rarr; `cancelled` (automatically restores inventory)
- Terminal states: `delivered` and `cancelled` cannot transition backwards.

---

## Project Structure

```text
SHOP SPHERE/
â”œâ”€â”€ client/                     # React 18, Vite, Tailwind CSS Frontend
â”‚   â”œâ”€â”€ public/
â”‚   â”‚   â””â”€â”€ vite.svg
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ components/         # Reusable UI elements (Navbar, Footer, HealthBadge, Cards, Modals)
â”‚   â”‚   â”œâ”€â”€ context/            # Global state (AuthContext, CartContext)
â”‚   â”‚   â”œâ”€â”€ layouts/            # Layout wrappers (RootLayout)
â”‚   â”‚   â”œâ”€â”€ pages/              # Views (Home, Catalog, ProductDetails, Cart, Checkout, OrderHistory, Admin)
â”‚   â”‚   â”œâ”€â”€ services/           # API services (api, authService, productService, orderService, adminService)
â”‚   â”‚   â”œâ”€â”€ utils/              # Formatters (INR currency, dates)
â”‚   â”‚   â”œâ”€â”€ App.jsx             # React Router hierarchy
â”‚   â”‚   â”œâ”€â”€ index.css           # Tailwind CSS directives
â”‚   â”‚   â””â”€â”€ main.jsx            # React root mount
â”‚   â”œâ”€â”€ index.html              # Loads official Razorpay Checkout SDK
â”‚   â”œâ”€â”€ package.json
â”‚   â”œâ”€â”€ tailwind.config.js
â”‚   â”œâ”€â”€ vite.config.js          # Vite config with API proxy to port 5000
â”‚   â”œâ”€â”€ .env                    # Local environment variables
â”‚   â””â”€â”€ .env.example
â”œâ”€â”€ server/                     # Node.js, Express.js Backend
â”‚   â”œâ”€â”€ scripts/
â”‚   â”‚   â””â”€â”€ seed.js             # Realistic sample products & demo accounts seed script
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ config/             # DB (Atlas/Local), Env parsing, Razorpay SDK initialization
â”‚   â”‚   â”œâ”€â”€ controllers/        # Controllers (auth, product, order, payment, admin)
â”‚   â”‚   â”œâ”€â”€ middleware/         # Error handler, 404 handler, auth guards (requireAuth, requireAdmin)
â”‚   â”‚   â”œâ”€â”€ models/             # Mongoose schemas (User, Product, Order, WebhookEvent)
â”‚   â”‚   â”œâ”€â”€ routes/             # Versioned Express routes (/api/v1/...)
â”‚   â”‚   â”œâ”€â”€ utils/              # JWT signing/verifying helpers
â”‚   â”‚   â”œâ”€â”€ validators/         # Input validation schemas
â”‚   â”‚   â”œâ”€â”€ app.js              # Express app with Helmet, CORS, Rate Limiters, rawBody capture
â”‚   â”‚   â””â”€â”€ server.js           # Server entry point & graceful shutdown
â”‚   â”œâ”€â”€ tests/
â”‚   â”‚   â”œâ”€â”€ fullSuite.test.js   # 35-assertion comprehensive test suite
â”‚   â”‚   â””â”€â”€ payment.test.js     # Dedicated payment & webhook verification test suite
â”‚   â”œâ”€â”€ package.json
â”‚   â”œâ”€â”€ .env                    # Server environment variables
â”‚   â””â”€â”€ .env.example
â”œâ”€â”€ ShopSphere_API_Collection.postman_collection.json # Ready-to-import Postman collection
â”œâ”€â”€ package.json                # Root orchestration scripts
â”œâ”€â”€ .gitignore                  # Git ignore rules
â””â”€â”€ README.md
```

---

## Environment Variables Configuration

### Server (`server/.env`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection (Local fallback or MongoDB Atlas)
# For Atlas, paste your cluster URI:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shopsphere?retryWrites=true&w=majority
MONGODB_URI=mongodb://127.0.0.1:27017/shopsphere

# JWT Authentication
JWT_SECRET=shopsphere_dev_secret_key_change_in_production_9988776655
JWT_EXPIRES_IN=7d

# Razorpay Test Mode Credentials (https://dashboard.razorpay.com/#/access/api_keys)
RAZORPAY_KEY_ID=rzp_test_placeholder_key_id
RAZORPAY_KEY_SECRET=placeholder_key_secret
RAZORPAY_WEBHOOK_SECRET=placeholder_webhook_secret
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Quickstart & PowerShell Commands

Open two PowerShell windows in `c:\Users\aadit\Downloads\SHOP SPHERE`:

### 1. Seed the Database with Realistic Products & Users
```powershell
npm run seed
```
*Seeds 15 realistic consumer electronics products across 5 categories and creates demo Administrator and Customer accounts.*

### 2. Start the Backend Server
```powershell
cd server
npm run dev
```
*Backend runs on `http://localhost:5000` with `nodemon` auto-reload.*

### 3. Start the Frontend Client
```powershell
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173` with Vite HMR.*

### 4. Run the Full Automated Test Suite
In a new PowerShell tab:
```powershell
npm test
```
*Executes all 35 end-to-end integration tests (Auth, Products, Orders, Razorpay HMAC, Webhooks, Admin RBAC).*

---

## Demo Login Credentials

The seed script creates two pre-configured accounts:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@shopsphere.dev` | `Customer@12345` | Browsing, shopping cart, checkout, order history |
| **Administrator** | `admin@shopsphere.dev` | `Admin@12345` | Storefront + Admin Dashboard, inventory CRUD, fulfillment |

*(You can also use the one-click "Demo Customer" / "Demo Admin" quick-fill buttons on `http://localhost:5173/login`)*.

---

## Razorpay Test Mode Verification Workflow

### Test Credentials (Test Mode Only)
- **Test Card Number**: `4111 1111 1111 1111`
- **Expiry**: Any future date (e.g. `12/30`)
- **CVV**: `123`
- **OTP**: `123456`
- **Test UPI**: `success@razorpay`
- **Test Netbanking**: Any simulated bank (e.g., HDFC, ICICI, SBI)

### Flow:
1. Customer adds products to the shopping cart.
2. At checkout, enters shipping address and places order.
3. On the Order Confirmation page, clicks **"Pay with Razorpay"**.
4. The official Razorpay Checkout popup appears.
5. Upon payment submission, Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
6. The frontend sends these to `POST /api/v1/payments/verify`.
7. The server calculates the HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET` and compares it using `crypto.timingSafeEqual`.
8. Order status transitions from `placed` to `processing`, `paymentStatus` transitions to `paid`, and a cryptographic receipt is displayed.

---

## Postman API Testing Guide

Import the included Postman collection:
1. Open Postman &rarr; **Import** &rarr; Select `ShopSphere_API_Collection.postman_collection.json`.
2. The collection includes 6 organized folders:
   - `1. System Health`: `GET /health`
   - `2. Authentication`: Register, Customer Login, Admin Login, Profile Me
   - `3. Products Catalogue`: List products, categories, search, single product, admin product create
   - `4. Orders & Cart`: Validate cart, create order, order history, single order
   - `5. Razorpay Payments`: Create Razorpay order, verify signature
   - `6. Admin Management`: Dashboard metrics, all orders, update status
3. Logging in via Postman automatically sets the collection variable `customerToken` or `adminToken` for subsequent requests.

---

## Common Errors & Troubleshooting

| Error | Root Cause | Solution |
| :--- | :--- | :--- |
| `MongooseServerSelectionError` / `ETIMEDOUT` | MongoDB Atlas IP whitelist blocking connection | Go to MongoDB Atlas &rarr; Network Access &rarr; Add IP Address &rarr; Allow `0.0.0.0/0` or add your current IP. |
| `bad auth: Authentication failed` | Invalid username or password in `MONGODB_URI` | Verify database user credentials in Atlas Database Access. If your password contains `@` or `#`, URL-encode them. |
| `EADDRINUSE: address already in use :::5000` | Another process is already running on port 5000 | In PowerShell, run: `Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess \| Stop-Process -Force` |
| `Invalid payment signature` | Signature mismatch or altered key secret | Ensure `RAZORPAY_KEY_SECRET` matches the key ID used in Razorpay Dashboard. |
| `Cannot transition order from X to Y` | State machine enforcement | Orders can only progress forward: `placed` &rarr; `processing` &rarr; `shipped` &rarr; `delivered`. |

---

## Placement Interview Talking Points

1. **Why integer paise instead of floating-point rupees?**
   - In floating-point arithmetic (`0.1 + 0.2 !== 0.3`), accumulative rounding errors can lead to transaction mismatches with banks and payment gateways. Storing integers represents the smallest atomic unit of currency (paise for INR, cents for USD), guaranteeing 100% precision.
2. **Why preserve the raw body Buffer for webhooks?**
   - Webhook HMAC-SHA256 signatures are calculated over the exact bytes sent across the wire. If Express parses the JSON and then re-stringifies it, altered keys or whitespace differences invalidate the cryptographic signature. Using `express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })` preserves the exact original payload.
3. **How is inventory race condition / overselling prevented?**
   - Instead of heavy distributed locks or transaction table locking, we use MongoDB conditional atomic mutations: `{ _id: id, stock: { $gte: quantity } }` with `{ $inc: { stock: -quantity } }`. If two requests attempt to buy the last item at the exact same millisecond, only one update matches and succeeds; the other returns null and triggers an automatic rollback of earlier items.
4. **Why is `timingSafeEqual` used for payment signature verification?**
   - Standard string comparisons (`===`) exit early on the first differing character, leaking execution timing information that can allow attackers to perform timing-based forgery attacks. `crypto.timingSafeEqual` takes constant time regardless of where discrepancies occur.

---

## Remaining Production-Hardening Considerations

For a full enterprise production release beyond the placement portfolio scope:
1. **Live Mode Transition**: Replace Test Mode keys with Razorpay Live credentials and register a production webhook URL with SSL.
2. **Image CDN Hosting**: Replace direct Unsplash URLs with Cloudinary, AWS S3, or Cloudflare Images for client image uploads.
3. **Redis Caching**: Cache product catalogue listings and category queries in Redis with cache invalidation on product updates.
4. **Email/SMS Notifications**: Integrate SendGrid or Nodemailer + Twilio to dispatch transactional order confirmation emails and SMS shipping tracking links.
5. **CSRF & Refresh Token Rotation**: Implement HTTP-only cookies with rotating refresh tokens for enhanced session security.

