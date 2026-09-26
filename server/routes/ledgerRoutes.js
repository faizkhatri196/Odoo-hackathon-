const express = require('express');
const router = express.Router();
const { getLedger } = require('../controllers/ledgerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getLedger);

module.exports = router;
