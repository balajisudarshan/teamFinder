const User = require('../models/User');
const Team = require('../models/Team');
const JoinRequest = require('../models/JoinRequest');
const { generateTeamsExcelBuffer } = require('../utils/excelExport');

// @desc    Get system overview statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeams = await Team.countDocuments();
    const openTeams = await Team.countDocuments({ status: 'open' });
    const fullTeams = await Team.countDocuments({ status: { $in: ['full', 'completed'] } });
    const sihTeams = await Team.countDocuments({
      hackathon: { $regex: /sih|smart india/i },
    });
    const totalRequests = await JoinRequest.countDocuments();

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeams,
        openTeams,
        fullTeams,
        sihTeams,
        totalRequests,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students with search & filter
// @route   GET /api/admin/students
// @access  Private (Admin only)
const getAllStudents = async (req, res) => {
  try {
    const { search, department, year, gender } = req.query;

    let query = { role: 'student' };

    if (department && department !== 'All') {
      query.department = department;
    }

    if (year && year !== 'All') {
      query.year = year;
    }

    if (gender && gender !== 'All') {
      query.gender = gender;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { rollNumber: searchRegex },
        { email: searchRegex },
        { skills: searchRegex },
      ];
    }

    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all teams for admin with search & filter
// @route   GET /api/admin/teams
// @access  Private (Admin only)
const getAllTeams = async (req, res) => {
  try {
    const { search, hackathon, status } = req.query;

    let query = {};

    if (hackathon && hackathon !== 'All') {
      query.hackathon = { $regex: new RegExp(hackathon.trim(), 'i') };
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { teamName: searchRegex },
        { problemDomain: searchRegex },
        { skillsNeeded: searchRegex },
      ];
    }

    const teams = await Team.find(query)
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export teams and members to Excel (.xlsx)
// @route   GET /api/admin/export-excel
// @access  Private (Admin only)
const exportTeamsExcel = async (req, res) => {
  try {
    const { hackathon, status } = req.query;

    let query = {};
    if (hackathon && hackathon !== 'All') {
      query.hackathon = { $regex: new RegExp(hackathon.trim(), 'i') };
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    const teams = await Team.find(query)
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills')
      .sort({ createdAt: -1 });

    const excelBuffer = generateTeamsExcelBuffer(teams);

    const filename = `NBKRIST_Hackathon_Teams_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.end(excelBuffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to export Excel' });
  }
};

module.exports = {
  getAdminStats,
  getAllStudents,
  getAllTeams,
  exportTeamsExcel,
};
