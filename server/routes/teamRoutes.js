const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  removeMember,
  deleteTeam,
  getMyTeams,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { requireNotFlagged } = require('../middleware/flagCheckMiddleware');

router.route('/')
  .get(getTeams)
  .post(protect, requireNotFlagged, createTeam);

router.get('/my-teams', protect, getMyTeams);

router.route('/:id')
  .get(getTeamById)
  .put(protect, requireNotFlagged, updateTeam)
  .delete(protect, requireNotFlagged, deleteTeam);

router.delete('/:id/members/:memberId', protect, requireNotFlagged, removeMember);

module.exports = router;
