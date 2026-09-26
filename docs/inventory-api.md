# StockSense Inventory & Stock Engine API Documentation

## Overview
This documentation outlines the backend REST APIs for Product Management, Warehouse/Location Hierarchy, Central Stock Engine, and Double-Entry Stock Ledger.

All stock changes pass through the **Stock Engine** (`StockService`), preserving stock invariants, rejecting negative inventory, and creating immutable audit trails in the **Stock Ledger**.

---

## Authentication & Authorization
Include JWT Bearer token in the `Authorization` header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 1. Product Management (`/api/products`)

### 1.1 List Products
* **Method:** `GET`
* **URL:** `/api/products`
* **Query Parameters:**
  * `search` (string): Search by Product Name or SKU (case-insensitive)
  * `category` (string): Filter by Category name
  * `warehouse` (string, ObjectId): Filter products with stock in a specific warehouse
  * `stockStatus` (string): `IN_STOCK` | `LOW_STOCK` | `OUT_OF_STOCK`
  * `page` (number, default: 1)
  * `limit` (number, default: 20)
* **Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f000000000000000000010",
      "name": "Steel Rod",
      "sku": "ST-001",
      "category": "Raw Materials",
      "unitOfMeasure": "KG",
      "costPrice": 45.0,
      "sellingPrice": 70.0,
      "totalQuantity": 100,
      "minReorderLevel": 20,
      "stockStatus": "IN_STOCK",
      "warehouseStock": [
        {
          "warehouse": { "_id": "...", "name": "Main Warehouse", "code": "MAIN" },
          "quantity": 100,
          "locationRack": "MAIN-RACK-A"
        }
      ],
      "isActive": true
    }
  ],
  "pagination": { "total": 1, "page": 1, "pages": 1, "limit": 20 }
}
```

### 1.2 Get Product Details
* **Method:** `GET`
* **URL:** `/api/products/:id`
* **Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Steel Rod",
    "sku": "ST-001",
    "costPrice": 45.0,
    "sellingPrice": 70.0,
    "totalQuantity": 100,
    "minReorderLevel": 20,
    "stockSummary": {
      "productId": "...",
      "name": "Steel Rod",
      "sku": "ST-001",
      "totalQuantity": 100,
      "stockStatus": "IN_STOCK",
      "warehouseStock": [...],
      "locationStock": [...]
    }
  }
}
```

### 1.3 Create Product
* **Method:** `POST`
* **URL:** `/api/products`
* **Body:**
```json
{
  "name": "Steel Rod",
  "sku": "ST-001",
  "category": "Raw Materials",
  "unitOfMeasure": "KG",
  "costPrice": 45.0,
  "sellingPrice": 70.0,
  "minReorderLevel": 20,
  "initialStock": 100,
  "warehouseId": "65f000000000000000000001",
  "locationRack": "MAIN-RACK-A"
}
```
* **Validation & Actions:**
  * SKU normalized to uppercase, unique check enforced.
  * If `initialStock > 0`, invokes Stock Engine to record `INITIAL_STOCK` in warehouse/location and creates an audit ledger entry.
* **Response:** `201 Created`

### 1.4 Update Product Metadata
* **Method:** `PUT`
* **URL:** `/api/products/:id`
* **Body:** Allowed fields: `name`, `category`, `unitOfMeasure`, `costPrice`, `sellingPrice`, `minReorderLevel`, `description`
* **Critical Rule:** Direct tampering of `totalQuantity`, `initialStock`, or `warehouseStock` is strictly prohibited. Stock mutations only occur through Stock Engine transactions (Receipts, Deliveries, Transfers, Adjustments).
* **Response:** `200 OK`

### 1.5 Safe Soft Delete
* **Method:** `DELETE`
* **URL:** `/api/products/:id`
* **Action:** Sets `isActive = false`, preserving historical audits and ledger traces.
* **Response:** `200 OK`

### 1.6 Product Stock & Availability Breakdown
* **Method:** `GET`
* **URL:** `/api/products/:id/stock` & `/api/products/:id/availability`

---

## 2. Stock Management & Engine Operations (`/api/stock`)

### 2.1 Multi-Location Stock Overview
* **Method:** `GET`
* **URL:** `/api/stock`
* **Filters:** `productId`, `warehouseId`, `locationId`, `status` (`IN_STOCK` | `LOW_STOCK` | `OUT_OF_STOCK`), `page`, `limit`

### 2.2 Dashboard Stock Summary
* **Method:** `GET`
* **URL:** `/api/stock/summary`
* **Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalInventoryQuantity": 515,
    "lowStockCount": 1,
    "outOfStockCount": 0,
    "warehouses": [
      { "warehouseId": "...", "name": "Main Warehouse", "code": "MAIN", "totalQuantity": 365, "productCount": 4 }
    ],
    "categories": [
      { "category": "Raw Materials", "totalQuantity": 300, "productCount": 2 }
    ]
  }
}
```

### 2.3 Low Stock Alerts
* **Method:** `GET`
* **URL:** `/api/stock/low`
* **Condition:** `0 < totalQuantity <= minReorderLevel`

### 2.4 Out of Stock
* **Method:** `GET`
* **URL:** `/api/stock/out-of-stock`
* **Condition:** `totalQuantity <= 0`

### 2.5 Transfer Stock
* **Method:** `POST`
* **URL:** `/api/stock/transfer`
* **Body:**
```json
{
  "productId": "...",
  "fromWarehouseId": "...",
  "toWarehouseId": "...",
  "quantity": 30,
  "notes": "Relocating excess stock to secondary depot"
}
```
* **Invariant:** Total company stock before === Total company stock after. Deducts from source, increases destination, and logs `TRANSFER_OUT` and `TRANSFER_IN` ledgers.

### 2.6 Inventory Adjustment
* **Method:** `POST`
* **URL:** `/api/stock/adjust`
* **Body:**
```json
{
  "productId": "...",
  "warehouseId": "...",
  "countedQuantity": 97,
  "reason": "Physical count audit reconciliation"
}
```
* **Rule:** If recorded is 100 and counted is 97, delta is -3. Records `ADJUSTMENT` movement with quantity 3 and sets stock to 97.

---

## 3. Double-Entry Stock Ledger (`/api/ledger` or `/api/stock/ledger`)

### 3.1 Query Audit Trail
* **Method:** `GET`
* **URL:** `/api/ledger`
* **Query Parameters:** `productId`, `warehouseId`, `locationId`, `transactionType`, `dateFrom`, `dateTo`, `page`, `limit`
* **Response:** `200 OK`
```json
{
  "success": true,
  "entries": [
    {
      "_id": "...",
      "transactionType": "RECEIPT",
      "referenceNumber": "REC-001",
      "product": { "_id": "...", "name": "Steel Rod", "sku": "ST-001" },
      "warehouse": { "_id": "...", "name": "Main Warehouse", "code": "MAIN" },
      "quantityChange": 50,
      "previousQuantity": 100,
      "newQuantity": 150,
      "unitCost": 45.0,
      "totalCost": 2250.0,
      "createdAt": "2026-09-26T04:00:00.000Z"
    }
  ],
  "total": 1
}
```
* **Immutability Guarantee:** StockLedger entries are strictly append-only. Any attempt to `updateOne`, `delete`, or tamper with historical records is blocked at the schema level.

---

## 4. Categories, Warehouses & Locations

* Categories: `/api/categories` (`GET`, `POST`, `PUT /:id`, `DELETE /:id`)
* Warehouses: `/api/warehouses` (`GET`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`)
* Locations: `/api/locations` (`GET`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`)
* Reorder Rules: `/api/reorder-rules` (`GET`, `POST`, `PUT /:id`, `DELETE /:id`)

---

## 5. Member 4 Service Integration Contracts
Member 4 can directly invoke `StockService` from any operational controller:

```javascript
const StockService = require('../services/stockService');

// Receipts Validation
await StockService.increaseStock({
  productId: item.product,
  warehouseId: receipt.warehouse,
  locationId: item.locationId,
  quantity: item.receivedQty,
  movementType: 'RECEIPT',
  referenceId: receipt._id,
  referenceNumber: receipt.receiptNumber,
  performedBy: req.user._id,
  notes: `Inbound receipt from ${receipt.supplier.name}`
});

// Deliveries Validation (rejects if insufficient)
await StockService.decreaseStock({
  productId: item.product,
  warehouseId: delivery.warehouse,
  locationId: item.locationId,
  quantity: item.deliveredQty,
  movementType: 'DELIVERY',
  referenceId: delivery._id,
  referenceNumber: delivery.deliveryNumber,
  performedBy: req.user._id,
  notes: `Outbound delivery to ${delivery.customer.name}`
});

// Transfers
await StockService.transferStock({
  productId: item.product,
  fromWarehouseId: transfer.fromWarehouse,
  toWarehouseId: transfer.toWarehouse,
  quantity: item.quantity,
  referenceId: transfer._id,
  referenceNumber: transfer.transferNumber,
  performedBy: req.user._id
});
```
