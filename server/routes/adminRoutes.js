const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllStudents,
  getAllTeams,
  getAllApplications,
  exportTeamsExcel,
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

module.exports = router;
