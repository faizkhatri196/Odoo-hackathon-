const express = require('express');
const router = express.Router();
const {
  getTeamMembers,
  createTeamMember,
  removeTeamMember,
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getTeamMembers);
router.post('/', authorize('admin'), createTeamMember);
router.delete('/:id', authorize('admin'), removeTeamMember);

module.exports = router;
