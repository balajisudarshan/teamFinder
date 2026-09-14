const express = require('express');
const router = express.Router();
const {
  sendJoinRequest,
  getTeamRequests,
  respondToRequest,
  getMyRequests,
  sendTeamInvitation,
  getMyInvitations,
  respondToInvitation,
  getTeamInvitations,
  getUnallocatedStudents,
  getNotifications,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');
const { requireNotFlagged } = require('../middleware/flagCheckMiddleware');

// Static / Specific routes (MUST come before generic /:teamId and /:requestId)
router.get('/notifications', protect, getNotifications);
router.post('/invite', protect, requireNotFlagged, sendTeamInvitation);
router.get('/unallocated', protect, getUnallocatedStudents);
router.get('/my/sent', protect, getMyRequests);
router.get('/my/invitations', protect, getMyInvitations);
router.put('/invitations/:inviteId/respond', protect, requireNotFlagged, respondToInvitation);
router.get('/team/:teamId/invitations', protect, getTeamInvitations);
router.get('/team/:teamId', protect, getTeamRequests);

// Generic Parameterized Routes
router.post('/:teamId', protect, requireNotFlagged, sendJoinRequest);
router.put('/:requestId', protect, requireNotFlagged, respondToRequest);

module.exports = router;

