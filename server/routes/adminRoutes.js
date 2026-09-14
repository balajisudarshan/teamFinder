const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllStudents,
  getAllTeams,
  getAllApplications,
  getAdminRoster,
  exportTeamsExcel,
  toggleUserFlag,
  toggleTeamFlag,
  deleteTeamByAdmin,
  deleteUserByAdmin,
  deleteApplicationByAdmin,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Roster directory view is accessible to authenticated users (team leaders, students, admins)
router.get('/roster', protect, getAdminRoster);

// All other coordinator management routes require administrator privileges
router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/students', getAllStudents);
router.get('/teams', getAllTeams);
router.get('/applications', getAllApplications);
router.get('/export-excel', exportTeamsExcel);

// Flag / Unflag routes
router.put('/users/:userId/flag', toggleUserFlag);
router.put('/teams/:teamId/flag', toggleTeamFlag);

// Admin Deletion routes
router.delete('/teams/:teamId', deleteTeamByAdmin);
router.delete('/users/:userId', deleteUserByAdmin);
router.delete('/applications/:applicationId', deleteApplicationByAdmin);

module.exports = router;
