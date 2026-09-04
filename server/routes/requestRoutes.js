const express = require('express');
const router = express.Router();
const {
  sendJoinRequest,
  getTeamRequests,
  respondToRequest,
  getMyRequests,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');
const { joinRequestLimiter } = require('../middleware/rateLimiter');
const { requireNotFlagged } = require('../middleware/flagCheckMiddleware');

router.post('/:teamId', protect, requireNotFlagged, joinRequestLimiter, sendJoinRequest);
router.get('/team/:teamId', protect, getTeamRequests);
router.put('/:requestId', protect, requireNotFlagged, respondToRequest);
router.get('/my/sent', protect, getMyRequests);

module.exports = router;
