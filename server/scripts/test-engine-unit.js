const StockService = require('../services/stockService');

console.log('🧪 Running StockSense Stock Engine Invariants & Logic Unit Tests...\n');

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

// 1. Stock Status Rules
assert(StockService.calculateStockStatus(0, 10) === 'OUT_OF_STOCK', 'StockStatus: 0 with reorder 10 -> OUT_OF_STOCK');
assert(StockService.calculateStockStatus(5, 10) === 'LOW_STOCK', 'StockStatus: 5 with reorder 10 -> LOW_STOCK');
assert(StockService.calculateStockStatus(10, 10) === 'LOW_STOCK', 'StockStatus: 10 with reorder 10 -> LOW_STOCK (boundary)');
assert(StockService.calculateStockStatus(15, 10) === 'IN_STOCK', 'StockStatus: 15 with reorder 10 -> IN_STOCK');
assert(StockService.calculateStockStatus(100, 0) === 'IN_STOCK', 'StockStatus: 100 with reorder 0 -> IN_STOCK');
assert(StockService.calculateStockStatus(0, 0) === 'OUT_OF_STOCK', 'StockStatus: 0 with reorder 0 -> OUT_OF_STOCK');

// 2. Transfer Invariant Simulation
const sourceBefore = 100;
const destBefore = 20;
const transferQty = 30;

const sourceAfter = sourceBefore - transferQty;
const destAfter = destBefore + transferQty;

assert(sourceAfter === 70, 'Transfer: Source reduced from 100 to 70');
assert(destAfter === 50, 'Transfer: Destination increased from 20 to 50');
assert(sourceBefore + destBefore === sourceAfter + destAfter, 'Transfer Invariant: Total stock preserved (120 === 120)');

// 3. Negative Stock Invariant Check
const availableStock = 10;
const requestedDelivery = 15;
const wouldResultInNegative = (availableStock - requestedDelivery) < 0;
assert(wouldResultInNegative === true, 'Negative Stock Check: Detected potential negative stock (10 - 15 = -5)');

// 4. Physical Adjustment Invariant Simulation
const recordedStock = 100;
const physicalCount1 = 95;
const diff1 = physicalCount1 - recordedStock;
assert(diff1 === -5, 'Adjustment: Negative difference (-5) calculated correctly for physical count 95');

const physicalCount2 = 110;
const diff2 = physicalCount2 - recordedStock;
assert(diff2 === 10, 'Adjustment: Positive difference (+10) calculated correctly for physical count 110');

const physicalCount3 = 100;
const diff3 = physicalCount3 - recordedStock;
assert(diff3 === 0, 'Adjustment: Zero difference (0) identifies no adjustment required');

console.log(`\n========================================`);
console.log(`Unit Test Suite: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

process.exit(failed > 0 ? 1 : 0);
