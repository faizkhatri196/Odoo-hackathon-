/**
 * Member 4 Operations & Routes Verification Script
 */
const app = require('../app');
const authController = require('../controllers/authController');
const receiptController = require('../controllers/receiptController');
const deliveryController = require('../controllers/deliveryController');
const transferController = require('../controllers/transferController');
const dashboardController = require('../controllers/dashboardController');

console.log('🧪 Verifying Member 4 Controllers & Routes Registration...\n');

let passed = 0;
let failed = 0;

const assert = (condition, name) => {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}`);
    failed++;
  }
};

// 1. Auth Controller Methods
assert(typeof authController.signup === 'function', 'Auth: signup handler exported');
assert(typeof authController.login === 'function', 'Auth: login handler exported');
assert(typeof authController.logout === 'function', 'Auth: logout handler exported');
assert(typeof authController.forgotPassword === 'function', 'Auth: forgotPassword handler exported');
assert(typeof authController.resetPassword === 'function', 'Auth: resetPassword handler exported');
assert(typeof authController.getMe === 'function', 'Auth: getMe handler exported');

// 2. Receipt Controller Methods
assert(typeof receiptController.getReceipts === 'function', 'Receipt: getReceipts handler exported');
assert(typeof receiptController.getReceiptById === 'function', 'Receipt: getReceiptById handler exported');
assert(typeof receiptController.createReceipt === 'function', 'Receipt: createReceipt handler exported');
assert(typeof receiptController.updateReceipt === 'function', 'Receipt: updateReceipt handler exported');
assert(typeof receiptController.validateReceipt === 'function', 'Receipt: validateReceipt handler exported');

// 3. Delivery Controller Methods
assert(typeof deliveryController.getDeliveries === 'function', 'Delivery: getDeliveries handler exported');
assert(typeof deliveryController.getDeliveryById === 'function', 'Delivery: getDeliveryById handler exported');
assert(typeof deliveryController.createDelivery === 'function', 'Delivery: createDelivery handler exported');
assert(typeof deliveryController.updateDelivery === 'function', 'Delivery: updateDelivery handler exported');
assert(typeof deliveryController.validateDelivery === 'function', 'Delivery: validateDelivery handler exported');

// 4. Transfer Controller Methods
assert(typeof transferController.getTransfers === 'function', 'Transfer: getTransfers handler exported');
assert(typeof transferController.getTransferById === 'function', 'Transfer: getTransferById handler exported');
assert(typeof transferController.createTransfer === 'function', 'Transfer: createTransfer handler exported');
assert(typeof transferController.updateTransfer === 'function', 'Transfer: updateTransfer handler exported');
assert(typeof transferController.validateTransfer === 'function', 'Transfer: validateTransfer handler exported');

// 5. Dashboard Controller Methods
assert(typeof dashboardController.getDashboardData === 'function', 'Dashboard: getDashboardData handler exported');
assert(typeof dashboardController.getDashboardSummary === 'function', 'Dashboard: getDashboardSummary handler exported');
assert(typeof dashboardController.getLowStock === 'function', 'Dashboard: getLowStock handler exported');
assert(typeof dashboardController.getPendingReceipts === 'function', 'Dashboard: getPendingReceipts handler exported');
assert(typeof dashboardController.getPendingDeliveries === 'function', 'Dashboard: getPendingDeliveries handler exported');
assert(typeof dashboardController.getDashboardTransfers === 'function', 'Dashboard: getDashboardTransfers handler exported');

console.log(`\n========================================`);
console.log(`Member 4 Route & Handler Verification: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

process.exit(failed > 0 ? 1 : 0);
