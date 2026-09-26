# StockSense Operations & Backend Integration API Documentation (Member 4)

## Overview
This document details the backend operational REST APIs developed by **Team Member 4 (Backend Operations & Integration)** for **StockSense**.
These endpoints handle **Authentication & Authorization**, **Inbound Receipts**, **Outbound Deliveries**, **Internal Transfers**, and **Dashboard Analytics**, integrating directly with the central **Stock Engine** (`StockService`) developed by Member 3.

---

## Standard API Contract

### Success Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Envelope
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## 1. Authentication & User Management (`/api/auth`)

### 1.1 Signup
* **Method:** `POST`
* **URL:** `/api/auth/signup`
* **Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "inventory_manager",
  "warehouse": "65f000000000000000000001"
}
```
* **Response:** `201 Created`

### 1.2 Login
* **Method:** `POST`
* **URL:** `/api/auth/login`
* **Body:**
```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```
* **Response:** `200 OK` (returns JWT `token` and `user` object).

### 1.3 Logout
* **Method:** `POST`
* **URL:** `/api/auth/logout`
* **Response:** `200 OK`

### 1.4 Request Password Reset OTP
* **Method:** `POST`
* **URL:** `/api/auth/forgot-password`
* **Body:** `{ "email": "jane@example.com" }`
* **Response:** `200 OK` (generates 6-digit OTP valid for 15 minutes).

### 1.5 Reset Password with OTP
* **Method:** `POST`
* **URL:** `/api/auth/reset-password`
* **Body:**
```json
{
  "email": "jane@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```
* **Response:** `200 OK`

### 1.6 Current User Profile
* **Method:** `GET`
* **URL:** `/api/auth/me`
* **Header:** `Authorization: Bearer <token>`
* **Response:** `200 OK`

---

## 2. Receipts API (Inbound Shipments) (`/api/receipts`)

All endpoints require `Authorization: Bearer <token>`.

### 2.1 List Receipts
* **Method:** `GET`
* **URL:** `/api/receipts`
* **Query Params:** `status`, `warehouse`, `search`

### 2.2 Get Receipt by ID
* **Method:** `GET`
* **URL:** `/api/receipts/:id`

### 2.3 Create Receipt
* **Method:** `POST`
* **URL:** `/api/receipts`
* **Body:**
```json
{
  "supplier": {
    "name": "Acme Steel Supplies",
    "contact": "+1-555-0199",
    "email": "orders@acmesteel.com"
  },
  "warehouse": "65f000000000000000000001",
  "items": [
    {
      "product": "65f000000000000000000010",
      "orderedQty": 50,
      "unitCost": 45.0
    }
  ],
  "scheduledDate": "2026-09-28T09:00:00Z",
  "notes": "Urgent stock replenishment"
}
```
* **Response:** `201 Created`

### 2.4 Update Draft Receipt
* **Method:** `PUT`
* **URL:** `/api/receipts/:id`
* **Rule:** Only documents with status `draft`, `waiting`, or `ready` can be updated. Validated receipts are locked.

### 2.5 Validate Receipt & Receive Stock
* **Method:** `POST`
* **URL:** `/api/receipts/:id/validate`
* **Business Logic:**
  1. Checks receipt exists and is not already `done` or `canceled`.
  2. For each item, calls `StockService.increaseStock(...)`.
  3. Product warehouse stock and total balance increase.
  4. Immutable `RECEIPT` audit entry created in `StockLedger`.
  5. Receipt status transitioned to `done`, `receivedDate` set to current timestamp.
* **Response:** `200 OK`

---

## 3. Delivery API (Outbound Orders) (`/api/deliveries`)

### 3.1 List Deliveries
* **Method:** `GET`
* **URL:** `/api/deliveries`
* **Query Params:** `status`, `warehouse`, `search`

### 3.2 Get Delivery by ID
* **Method:** `GET`
* **URL:** `/api/deliveries/:id`

### 3.3 Create Delivery Order
* **Method:** `POST`
* **URL:** `/api/deliveries`
* **Body:**
```json
{
  "customer": {
    "name": "BuildCorp Enterprises",
    "shippingAddress": "45 Industrial Way",
    "contact": "+1-555-0288"
  },
  "warehouse": "65f000000000000000000001",
  "items": [
    {
      "product": "65f000000000000000000010",
      "demandedQty": 20,
      "unitPrice": 75.0
    }
  ],
  "scheduledDate": "2026-09-27T14:00:00Z"
}
```
* **Response:** `201 Created`

### 3.4 Update Draft Delivery
* **Method:** `PUT`
* **URL:** `/api/deliveries/:id`

### 3.5 Validate Delivery Order & Dispatch Stock
* **Method:** `POST`
* **URL:** `/api/deliveries/:id/validate`
* **Stock Safety Guarantee:**
  1. Pre-checks available stock for every demanded item in specified warehouse.
  2. If stock is insufficient, rejects immediately with `400 Bad Request` without partial deductions.
  3. Calls `StockService.decreaseStock(...)` for all items.
  4. Immutable `DELIVERY` audit entry logged in `StockLedger`.
  5. Status set to `done`, `dispatchedDate` recorded.
* **Response:** `200 OK`

---

## 4. Internal Transfer API (`/api/transfers`)

### 4.1 List Transfers
* **Method:** `GET`
* **URL:** `/api/transfers`
* **Query Params:** `status`, `fromWarehouse`, `toWarehouse`, `search`

### 4.2 Get Transfer by ID
* **Method:** `GET`
* **URL:** `/api/transfers/:id`

### 4.3 Create Transfer Request
* **Method:** `POST`
* **URL:** `/api/transfers`
* **Body:**
```json
{
  "fromWarehouse": "65f000000000000000000001",
  "toWarehouse": "65f000000000000000000002",
  "items": [
    {
      "product": "65f000000000000000000010",
      "quantity": 15
    }
  ],
  "notes": "Stock balancing between regional facilities"
}
```
* **Validation:** Rejects if source and destination are identical.
* **Response:** `201 Created`

### 4.4 Update Draft Transfer
* **Method:** `PUT`
* **URL:** `/api/transfers/:id`

### 4.5 Validate Transfer & Relocate Stock
* **Method:** `POST`
* **URL:** `/api/transfers/:id/validate`
* **Atomic Transfer:**
  1. Checks stock availability at source warehouse (`fromWarehouse`).
  2. Calls `StockService.transferStock(...)`:
     - Decreases stock at source (`TRANSFER_OUT`).
     - Increases stock at destination (`TRANSFER_IN`).
     - Total network stock remains completely invariant.
  3. Status set to `done`, `completedDate` recorded.
* **Response:** `200 OK`

---

## 5. Dashboard APIs (`/api/dashboard`)

* `GET /api/dashboard`: Full dashboard dataset with dynamic multi-criteria filtering (`type`, `status`, `warehouse`).
* `GET /api/dashboard/summary`: High-level inventory KPIs (total stock valuation, total products, low stock count, pending operations).
* `GET /api/dashboard/low-stock`: Products with stock below or at reorder thresholds (`totalQuantity <= minReorderLevel`).
* `GET /api/dashboard/pending-receipts`: Inbound shipments awaiting processing.
* `GET /api/dashboard/pending-deliveries`: Outbound orders awaiting dispatch.
* `GET /api/dashboard/transfers`: Active and recent inter-warehouse movements.

---

## 6. End-to-End Operational Lifecycle

```text
[1. User Login] -> Obtain Bearer Token
       ↓
[2. Dashboard View] -> View Real-Time Stock Valuation & Low Stock Alerts
       ↓
[3. Create Receipt] -> Draft Inbound Order with Supplier & Items
       ↓
[4. Validate Receipt] -> StockService.increaseStock -> Stock increases -> Ledger logged
       ↓
[5. Create Delivery] -> Customer Order with Demanded Quantities
       ↓
[6. Validate Delivery] -> Availability check -> StockService.decreaseStock -> Stock decreases
       ↓
[7. Internal Transfer] -> Move Stock from Main WH to Depot -> Stock balanced
       ↓
[8. Dashboard Updated] -> Real-time metrics accurately reflect all movements!
```
