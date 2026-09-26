# 📦 StockSense - Smart Inventory & Stock Management System

**StockSense** is an enterprise-ready, full-stack Inventory and Warehouse Operations Management platform built for high-throughput tracking, stock adjustments, receipts, deliveries, internal transfers, and double-entry stock ledger auditing inspired by Odoo ERP principles.

---

## 🏗️ Architecture & Project Structure

```
stocksense/
│
├── client/                         # React Frontend (Vite)
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/             # Reusable UI Components
│       ├── layouts/                # Dashboard & Auth Layouts
│       ├── pages/                  # Application Views
│       ├── services/               # Axios API Services
│       ├── context/                # Global Auth & Stock State
│       ├── hooks/                  # Custom React Hooks
│       ├── utils/                  # Date/Number formatters & constants
│       ├── routes/                 # Centralized React Router v6
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│
├── server/                         # Node.js + Express Backend
│   ├── config/                     # Database and environment configs
│   ├── models/                     # Mongoose Data Models
│   ├── controllers/                # Request Handlers
│   ├── routes/                     # Express REST Routes
│   ├── middleware/                 # Auth, Validation, Error Handling
│   ├── services/                   # Business Logic & Stock Calculations
│   ├── utils/                      # Token & OTP Generators, Constants
│   ├── app.js                      # Express App Configuration
│   └── server.js                   # Server Entrypoint
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `>= 18.x`
- **MongoDB**: Local or MongoDB Atlas URI

### 2. Installation
Install all dependencies across root, server, and client:
```bash
npm run install:all
```

### 3. Environment Setup
Configure your `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/stocksense
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

### 4. Running the Development Server
Run both client and server concurrently:
```bash
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)

---

## 🔑 Core Features & Modules

1. **Dashboard & KPI Analytics**: Real-time stock valuation, low stock alerts, incoming/outgoing flow statistics.
2. **Product Master**: SKUs, multi-warehouse stock counts, reorder thresholds, barcodes, category grouping.
3. **Receipts (Inbound)**: Supplier incoming shipments, quality checks, automatic ledger recording.
4. **Deliveries (Outbound)**: Customer orders picking, packing, dispatching, and stock reductions.
5. **Internal Transfers**: Inter-warehouse inventory movement tracking.
6. **Physical Inventory Adjustments**: Discrepancy reconciliation with automated audit trail.
7. **Stock Ledger & Audit Log**: Immutable double-entry transaction record for every stock movement.
