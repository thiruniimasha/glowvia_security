# Glowvia – Secure E-Commerce Web Application

This project is developed for Assessment 2: Secure Web Application Development.
It implements a small e-commerce web application with OIDC authentication (Auth0), order management, and security measures aligned with the OWASP Top 10.

---

## ⚡ Technology Stack
- **Frontend:** React (Vite) + TailwindCSS  
- **Backend:** Node.js + Express.js  
- **DB:** MongoDB (Mongoose)  
- **Auth:** Auth0 (OIDC)  
- **Security libs:** HTTPS, helmet, express-rate-limit, express-mongo-sanitize, express-validator, jwks-rsa / express-jwt

---

## ⚡ Features Implemented
- OIDC authentication (Auth0) — login/logout, access tokens, user claims
- Authenticated user profile display: name, email, contact number, country
- Place product orders with:
  - username (derived from IDP claims)
  - purchase date (not before today; Sundays excluded)
  - delivery time (10 AM, 11 AM, 12 PM)
  - delivery location (Sri Lanka districts list)
  - product (predefined), quantity, message
- View past and upcoming orders
- Access control: users can only view/manage their own orders

---



## 🔧 Quick Start (Local)

### 1. Clone
```bash
git clone https://github.com/<your-username>/glowvia_security.git
cd glowvia_security
```

### 2. Install
Backend:
```bash
cd server
npm install
```
Frontend:
```bash
cd ../client
npm install
```

### 3. Environment variables
Create `.env` in both `server/` and `client/` from the examples below.

**server/.env**
```ini
# Auth0 (replace with your values)
AUTH0_DOMAIN=dev-abc123.us.auth0.com
AUTH0_AUDIENCE=https://api.glowvia.local
AUTH0_CLIENT_ID=YOUR_AUTH0_CLIENT_ID

# MongoDB
MONGODB_URI=mongodb://localhost:27017/glowvia

# Local server options
PORT=4000
NODE_ENV=development

# Cookie/JWT secret for seller demo (use a strong secret in real deployments)
JWT_SECRET=ReplaceWithAStrongSecret

# Demo seller credentials (only for a simple demo seller login flow)
SELLER_EMAIL=seller@example.com
SELLER_PASSWORD=StrongPassword123
```

**client/.env**
```ini
VITE_AUTH0_DOMAIN=dev-abc123.us.auth0.com
VITE_AUTH0_CLIENT_ID=YOUR_AUTH0_CLIENT_ID
VITE_AUTH0_AUDIENCE=https://api.glowvia.local
VITE_BACKEND_URL=https://localhost:4000
```

### 4. Generate local HTTPS certs (for development)
From the `server/` folder:
```bash
cd server
node generateCert.js
```
This script (provided in the repo) will create a `certs/` folder with self-signed `key.pem` and `cert.pem` for local HTTPS.

### 5. Start servers
Start backend:
```bash
cd server
npm run start
# or, for dev with auto-reload:
# npm run dev
```
Start frontend:
```bash
cd ../client
npm run dev
# Open the printed https://localhost:5173 URL in your browser
```

---

## 🗃️ Database Setup

This app uses MongoDB.
Collections are auto-created by Mongoose.

---

## 🔑 Auth0 (OIDC) Setup
1. Create an Auth0 tenant (https://auth0.com).  
2. Create an **API** in Auth0:
   - Name: Glowvia API
   - Identifier: `https://api.glowvia.local` (or your own URL)
3. Create an **Application (Single Page Application)** and note the Client ID.  
4. Allowed callback URLs: `https://localhost:5173`  
   Allowed logout URLs: `https://localhost:5173`  
5. Add the Auth0 domain, audience and client id to the `.env` files above.

---

## 🔒 Security – OWASP Top 10 (short mapping)
- **A01 Broken Access Control:** server derives user identity from validated access tokens; `/api/order/user` returns only the caller's orders.  
- **A02 Cryptographic Failures:** local HTTPS, secure cookies, recommend strong TLS in production.  
- **A03 Injection:** `express-mongo-sanitize`, Mongoose (no raw string SQL), `express-validator`.  
- **A04 Insecure Design:** whitelisted delivery times/locations; date validation (no past dates, Sundays blocked).  
- **A05 Security Misconfiguration:** helmet (CSP/HSTS), CORS allowlist, no secrets checked in repo.  
- **A07 Identification & Authentication:** OIDC with JWKS verification (issuer + audience).  
- **A09 Logging & Monitoring:** safe error messages; structured dev logs.  
- **A10 SSRF:** application does not fetch untrusted URLs on the server.

---

## 📦 API Endpoints (main)
| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | `/api/user/profile`    | Get logged-in user profile         |
| PUT    | `/api/user/profile`    | Update profile (validated)         |
| GET    | `/api/order/user`      | List orders for the logged-in user |
| POST   | `/api/order/cod`       | Place a COD order                  |
| PUT    | `/api/order/cancel/:id`| Cancel an order (user must own it) |
| POST   | `/api/seller/login`    | Demo seller login (cookie-based)   |
| GET    | `/api/seller/logout`   | Clear seller cookie                |

---

## 🚀 Deployment Notes
- Backend: deploy to Node hosting (Heroku, Render, Fly.io, AWS ECS, etc.) with HTTPS.  
- Frontend: Vercel/Netlify.  
- Update `VITE_BACKEND_URL` after deployment.  

---


## ✍️ Author
- **SID:** SE2021053
- **Name:** T. H. Imasha 
- **Blog:** [https://medium.com/@yourhandle/your-post-slug](https://medium.com/@t.hiruniimasha2002/building-my-safe-e-commerce-app-oidc-and-owasp-takeaways-c8ef79679772)
