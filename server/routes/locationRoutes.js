const express = require('express');
const router = express.Router();
const {
  getLocations,
  createLocation,
  getLocationById,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getLocations).post(createLocation);
router.route('/:id').get(getLocationById).put(updateLocation).delete(deleteLocation);

module.exports = router;
