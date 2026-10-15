# ShopSphere — Placement-Ready MERN E-Commerce with Razorpay

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%26%20Mongoose-47A248.svg)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test%20Mode-0C2340.svg)](https://razorpay.com/)

ShopSphere is a robust, placement-ready e-commerce web application engineered with modern full-stack best practices. It features server-authoritative pricing calculated in integer paise (INR), cryptographically verified Razorpay Test Mode checkout (HMAC-SHA256), idempotent webhook ingestion with raw-body preservation, JWT authentication, and role-based access control.

---

## Current Status: Phase 1 Completed

- [x] **Phase 1: Project Scaffolding, Dependencies, Atlas Connection, React Setup & Health Check**
- [ ] Phase 2: Mongoose Schemas, Product Catalog, Seed Script, Search & Category Filters
- [ ] Phase 3: JWT Authentication, Bcrypt Password Hashing, Role-Based Access Control
- [ ] Phase 4: Shopping Cart, Server-Side Integer Paise Calculations & Atomic Stock Checks
- [ ] Phase 5: Razorpay Checkout Integration, HMAC-SHA256 Signature Verification & Webhooks
- [ ] Phase 6: Order Confirmation, Order History, Admin Dashboard & Fulfillment State Machine
- [ ] Phase 7: Validation, Error Handling, Responsive Polish, Automated Tests & Placement Review
- [ ] Phase 8: Deployment Preparation (Vercel + Render + MongoDB Atlas)

---

## 1. Project Directory Structure

```text
SHOP SPHERE/
├── client/                     # Frontend (React 18, Vite, Tailwind CSS)
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/         # Reusable UI elements (Navbar, Footer, HealthStatusBadge)
│   │   ├── context/            # React Context (Auth, Cart - upcoming)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Layout wrappers (RootLayout)
│   │   ├── pages/              # Views (HomePage, NotFoundPage)
│   │   ├── services/           # Axios instance & API endpoints (api.js)
│   │   ├── utils/              # Formatters (INR currency in paise, date formatting)
│   │   ├── App.jsx             # React Router structure
│   │   ├── index.css           # Tailwind directives & global styling
│   │   └── main.jsx            # React root mount
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js          # Vite config with API proxy to localhost:5000
│   ├── .env                    # Active local environment variables
│   └── .env.example            # Environment template
├── server/                     # Backend (Node.js, Express, Mongoose)
│   ├── scripts/                # Database seeding & administrative tasks (upcoming)
│   ├── src/
│   │   ├── config/             # DB & environment configuration (db.js, env.js)
│   │   ├── controllers/        # Route controllers (upcoming)
│   │   ├── middleware/         # Error handler, 404 handler, auth guards
│   │   ├── models/             # Mongoose schemas (upcoming)
│   │   ├── routes/             # Versioned Express routes (/api/v1/health)
│   │   ├── services/           # Razorpay & business logic (upcoming)
│   │   ├── utils/              # Helper utilities
│   │   ├── validators/         # Input validation schemas (upcoming)
│   │   ├── app.js              # Express app with Helmet, CORS, Rate-limiting & rawBody capture
│   │   └── server.js           # Server bootstrap and graceful shutdown
│   ├── tests/                  # Automated test suites
│   ├── package.json
│   ├── .env                    # Active server environment variables
│   └── .env.example            # Environment template
├── .gitignore                  # Git ignore rules for node_modules, .env, build artifacts
├── package.json                # Root orchestration scripts
└── README.md                   # Project documentation
```

---

## 2. Environment Variables Configuration

### Backend (`server/.env`)

The server configuration resides in `server/.env`. A template is provided in `server/.env.example`.

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend listening port | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas (or local) connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/shopsphere` |
| `JWT_SECRET` | Secret key for signing JWT tokens | Strong 256-bit string |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `RAZORPAY_KEY_ID` | Razorpay Test Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | From Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for verifying webhook HMAC | From Razorpay Dashboard |

> **MongoDB Connection Note**:
> By default, `server/.env` is initialized with `mongodb://127.0.0.1:27017/shopsphere` which connects to the MongoDB service running locally on your machine.
> To connect to **MongoDB Atlas**, update `MONGODB_URI` in `server/.env` with your Atlas connection URI:
> `mongodb+srv://<username>:<password>@<your-cluster>.mongodb.net/shopsphere?retryWrites=true&w=majority`

### Frontend (`client/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for backend API v1 | `http://localhost:5000/api/v1` |

---

## 3. How to Run (PowerShell)

Open two PowerShell windows in `c:\Users\aadit\Downloads\SHOP SPHERE`:

### Terminal 1: Start Backend Server
```powershell
cd server
npm run dev
```
*The backend starts with `nodemon` on `http://localhost:5000`.*

### Terminal 2: Start Frontend Client
```powershell
cd client
npm run dev
```
*The frontend starts with `vite` on `http://localhost:5173`.*

---

## 4. Verification & Testing

### 1. Verify Backend Health Check Endpoint

Run this command in PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/health" | ConvertTo-Json -Depth 5
```

**Expected JSON Response (`200 OK`)**:
```json
{
  "success": true,
  "service": "ShopSphere API",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-10-15T...",
  "uptimeSeconds": 15,
  "database": {
    "status": "connected",
    "readyState": 1,
    "isAtlas": false,
    "host": "127.0.0.1",
    "name": "shopsphere"
  },
  "razorpayConfigured": false
}
```

### 2. Verify Frontend Storefront

1. Open your browser and navigate to `http://localhost:5173`.
2. Notice the **ShopSphere** header with the "Test Mode" badge.
3. Observe the live **System Diagnostics & Connectivity** card:
   - **Express Server**: Online (Port 5000)
   - **Database**: Connected (Host & Database name)
   - **Razorpay Test**: Ready for Test Keys
   - **Security**: Active (Helmet headers, Rate Limiting, Raw Body Buffer verification)
4. Click **Refresh** to test real-time communication between React and the Express backend.

---

## 5. Security & Engineering Highlights (Implemented in Phase 1)

1. **Raw Body Buffer Preservation**: In `server/src/app.js`, `express.json` is configured with `verify: (req, res, buf) => { req.rawBody = buf; }`. This guarantees uncorrupted HMAC-SHA256 signature verification when receiving Razorpay webhooks in Phase 5.
2. **CORS & Helmet Security**: Custom allowed origins and hardened HTTP headers.
3. **API Rate Limiting**: Built-in 300 requests / 15 min window to protect against brute-force attacks and abuse.
4. **Centralized Error Handler**: Mongoose `CastError`, duplicate key `11000`, and `ValidationError` are handled uniformly with standardized JSON responses.
5. **Integer Paise Architecture**: Currency helpers configured for INR paise math (1 INR = 100 paise) to prevent floating-point calculation bugs.
