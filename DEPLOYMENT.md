# ShopSphere — Production Deployment Guide

This guide provides step-by-step instructions for deploying **ShopSphere** to **MongoDB Atlas** (Database), **Render** (Node.js/Express Backend), and **Vercel** (React/Vite Frontend).

---

## 1. Prerequisites

Before starting, ensure you have free accounts on:
1. [GitHub](https://github.com/)
2. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
3. [Render](https://render.com/)
4. [Vercel](https://vercel.com/)
5. [Razorpay Dashboard](https://dashboard.razorpay.com/) (Test Mode)

---

## 2. GitHub Setup

Initialize git and push the repository to your GitHub account:

```powershell
# 1. Rename local master branch to main (standard default)
git branch -M main

# 2. Add your GitHub remote repository (replace with your GitHub URL)
git remote add origin https://github.com/<your-username>/shopsphere.git

# 3. Push all commits to GitHub
git push -u origin main
```

> **Security Check**: Verify on GitHub that `.env` files are NOT visible. Only `.env.example` templates and source code should be present.

---

## 3. MongoDB Atlas Database Setup

1. **Log in** to your [MongoDB Atlas Dashboard](https://cloud.mongodb.com/).
2. **Create a Free Cluster**:
   - Choose **Shared (M0 Free)**.
   - Provider: **AWS**, Region: closest to you (e.g. `ap-south-1` Mumbai).
   - Cluster Name: `ShopSphereCluster`.
3. **Database Access (User)**:
   - Go to **Security** &rarr; **Database Access** &rarr; **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `shopsphere_admin`.
   - Password: Click **Autogenerate Secure Password** (save this password safely).
   - Database User Privileges: **Read and write to any database**.
4. **Network Access (IP Whitelist)**:
   - Go to **Security** &rarr; **Network Access** &rarr; **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) so that cloud platforms like Render can connect.
   - Click **Confirm**.
5. **Obtain Connection String**:
   - Go to **Deployment** &rarr; **Database** &rarr; Click **Connect** on your cluster.
   - Select **Drivers** &rarr; Driver: **Node.js**, Version: **5.5 or later**.
   - Copy the connection string. It will look like:
     ```text
     mongodb+srv://shopsphere_admin:<password>@shopspherecluster.xxxxxx.mongodb.net/shopsphere?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password.

6. **Seed MongoDB Atlas with Sample Products & Demo Users**:
   From your local PowerShell terminal, run:
   ```powershell
   $env:MONGODB_URI="mongodb+srv://shopsphere_admin:<password>@shopspherecluster.xxxxxx.mongodb.net/shopsphere?retryWrites=true&w=majority"
   npm run seed
   ```
   *(You will see 15 products and demo Customer/Admin accounts inserted into Atlas)*.

---

## 4. Backend Deployment on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** &rarr; Select **Web Service**.
3. Connect your GitHub repository (`shopsphere`).
4. Configure the service settings:
   - **Name**: `shopsphere-backend`
   - **Region**: Closest to your database (e.g., `Singapore` or `Frankfurt`)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: `Free`
5. Click **Advanced** &rarr; Add **Environment Variables**:

| Variable Key | Value / Instructions |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | Your MongoDB Atlas connection URI string |
| `JWT_SECRET` | A strong 256-bit random string (e.g., generated with `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `7d` |
| `RAZORPAY_KEY_ID` | Your Razorpay Test Key ID (`rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | A secret of your choice (e.g. `shopsphere_live_webhook_secret_123`) |
| `CLIENT_URL` | Set after Vercel deployment (e.g. `https://shopsphere.vercel.app`) |

6. Click **Deploy Web Service**.
7. Once deployment finishes, Render will provide a public URL:
   `https://shopsphere-backend.onrender.com`
8. Verify by opening in browser:
   `https://shopsphere-backend.onrender.com/api/v1/health`
   *(Should return `{ "success": true, "database": { "status": "connected", "isAtlas": true } }`)*.

---

## 5. Frontend Deployment on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository (`shopsphere`).
4. Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** &rarr; Select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Open **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://shopsphere-backend.onrender.com/api/v1` |

6. Click **Deploy**.
7. Vercel will build the frontend and provide your live application URL:
   `https://shopsphere.vercel.app`
8. **Final Linkage**: Return to Render &rarr; Environment &rarr; Update `CLIENT_URL` to your Vercel URL (`https://shopsphere.vercel.app`) and click Save Changes.

---

## 6. Razorpay Webhook Registration (Optional / Recommended)

To receive live asynchronous payment updates in your production backend:
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/) (Ensure **Test Mode** toggle is ON).
2. Go to **Settings** &rarr; **Webhooks** &rarr; **Add New Webhook**.
3. **Webhook URL**:
   `https://shopsphere-backend.onrender.com/api/v1/payments/webhook`
4. **Secret**: Enter the exact string you configured for `RAZORPAY_WEBHOOK_SECRET` in Render.
5. **Alert Email**: Enter your email address.
6. **Active Events**: Check the following:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
7. Click **Create Webhook**.

---

## 7. Post-Deployment Verification Checklist

- [ ] `GET /api/v1/health` returns status `200` with `isAtlas: true`.
- [ ] Visit the Vercel URL in browser; homepage renders cleanly with active products.
- [ ] Sign in with Demo Customer (`customer@shopsphere.dev` / `Customer@12345`).
- [ ] Add item to cart and proceed to checkout.
- [ ] Open Razorpay Test Mode checkout and complete payment with test card `4111 1111 1111 1111`.
- [ ] Verify Order confirmation updates to **PAID** with HMAC signature verification receipt.
- [ ] Sign in with Demo Admin (`admin@shopsphere.dev` / `Admin@12345`) and view the Admin Dashboard at `/admin`.
