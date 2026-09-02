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

router.route('/')
  .get(getTeams)
  .post(protect, createTeam);

router.get('/my-teams', protect, getMyTeams);

router.route('/:id')
  .get(getTeamById)
  .put(protect, updateTeam)
  .delete(protect, deleteTeam);

router.delete('/:id/members/:memberId', protect, removeMember);

module.exports = router;
