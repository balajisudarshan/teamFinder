const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllStudents,
  getAllTeams,
  getAllApplications,
  exportTeamsExcel,
  toggleUserFlag,
  toggleTeamFlag,
  deleteTeamByAdmin,
  deleteUserByAdmin,
  deleteApplicationByAdmin,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// All admin routes require both JWT protection and admin role
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
