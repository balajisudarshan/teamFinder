const express = require('express');
const router = express.Router();
const {
  sendJoinRequest,
  getTeamRequests,
  respondToRequest,
  getMyRequests,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');
const { requireNotFlagged } = require('../middleware/flagCheckMiddleware');

router.post('/:teamId', protect, requireNotFlagged, sendJoinRequest);
router.get('/team/:teamId', protect, getTeamRequests);
router.put('/:requestId', protect, requireNotFlagged, respondToRequest);
router.get('/my/sent', protect, getMyRequests);

module.exports = router;
