const express = require('express');
const router = express.Router();
const {
  sendJoinRequest,
  getTeamRequests,
  respondToRequest,
  getMyRequests,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:teamId', protect, sendJoinRequest);
router.get('/team/:teamId', protect, getTeamRequests);
router.put('/:requestId', protect, respondToRequest);
router.get('/my/sent', protect, getMyRequests);

module.exports = router;
