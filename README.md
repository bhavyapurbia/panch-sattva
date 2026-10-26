# PANCH SATTVA - React + Node.js Full Stack App

## 📁 Project Structure
```
PANCHSATWA_Full_Structure1/
├── panchsattva-react/     ← React frontend (Vite, self-contained assets in public/images)
├── panchsattva-server/    ← Node.js backend (Express + MongoDB, self-contained assets in public/images)
└── start-dev.ps1          ← One-click start script
```

---

## 🚀 How to Run

### Prerequisites
- Node.js v18+
- MongoDB installed and running locally

### Step 1: Start MongoDB
Make sure MongoDB is running on port 27017 (default).
- Windows: Open **MongoDB Compass** or run `mongod` in terminal

### Step 2: Configure Razorpay (Required for payments)
Edit `panchsattva-server/.env` and replace:
```
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET_HERE
```
Get keys from: https://dashboard.razorpay.com

### Step 3: Start Both Servers
**Option A - One click (recommended):**
```powershell
# Right-click start-dev.ps1 → Run with PowerShell
```

**Option B - Manually in two terminals:**
```powershell
# Terminal 1 - Backend
cd panchsattva-server
npm run dev

# Terminal 2 - Frontend
cd panchsattva-react
npm run dev
```

### Step 4: Open in Browser
- **Website:** http://localhost:5173
- **API:** http://localhost:5000/api

---

## 👤 Default Admin Login
```
Email:    admin@panchsattva.com
Password: Admin@123
```

---

## ✨ Features
| Feature | Status |
|---|---|
| Home page with hero, categories, testimonials | ✅ |
| Products listing with filters & search | ✅ |
| Product detail with buy now | ✅ |
| Shopping cart (persisted) | ✅ |
| Signup / Login with JWT | ✅ |
| Checkout with Indian states & cities | ✅ |
| Razorpay payment gateway | ✅ |
| Order success page with tracking | ✅ |
| User dashboard with order history | ✅ |
| Admin panel (products CRUD, order management, users) | ✅ |
| Mobile responsive | ✅ |
| MongoDB database | ✅ |
| Auto-seeded products (28 products) | ✅ |

---

## 🏗️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7 |
| State | Zustand |
| HTTP | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Payment | Razorpay |
| UI | Custom CSS (no framework) |
| Notifications | react-hot-toast |
| Icons | react-icons |
