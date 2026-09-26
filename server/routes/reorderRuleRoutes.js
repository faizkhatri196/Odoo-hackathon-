const express = require('express');
const router = express.Router();
const {
  getReorderRules,
  createReorderRule,
  updateReorderRule,
  deleteReorderRule,
} = require('../controllers/reorderRuleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getReorderRules).post(createReorderRule);
router.route('/:id').put(updateReorderRule).delete(deleteReorderRule);

module.exports = router;
