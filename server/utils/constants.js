const ROLES = {
  ADMIN: 'admin',
  INVENTORY_MANAGER: 'inventory_manager',
  WAREHOUSE_STAFF: 'warehouse_staff',
};

const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  WAITING: 'waiting',
  READY: 'ready',
  DONE: 'done',
  CANCELED: 'canceled',
};

const TRANSACTION_TYPES = {
  RECEIPT: 'RECEIPT',
  DELIVERY: 'DELIVERY',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  INITIAL_STOCK: 'INITIAL_STOCK',
};

module.exports = {
  ROLES,
  DOCUMENT_STATUS,
  TRANSACTION_TYPES,
};
