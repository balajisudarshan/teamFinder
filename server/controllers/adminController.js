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
    const { search, department, year, gender, page, limit } = req.query;

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

    const total = await User.countDocuments(query);

    let studentsQuery = User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    const isPaginationRequested = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = limit === 'all' ? total : Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    if (isPaginationRequested && limit !== 'all') {
      const skip = (pageNum - 1) * limitNum;
      studentsQuery = studentsQuery.skip(skip).limit(limitNum);
    }

    const students = await studentsQuery;

    res.json({
      success: true,
      count: students.length,
      total,
      page: pageNum,
      totalPages: isPaginationRequested && limit !== 'all' ? Math.ceil(total / limitNum) || 1 : 1,
      limit: limitNum,
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
    const { search, hackathon, status, page, limit } = req.query;

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

    const total = await Team.countDocuments(query);

    let teamsQuery = Team.find(query)
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills')
      .sort({ createdAt: -1 });

    const isPaginationRequested = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = limit === 'all' ? total : Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    if (isPaginationRequested && limit !== 'all') {
      const skip = (pageNum - 1) * limitNum;
      teamsQuery = teamsQuery.skip(skip).limit(limitNum);
    }

    const teams = await teamsQuery;

    res.json({
      success: true,
      count: teams.length,
      total,
      page: pageNum,
      totalPages: isPaginationRequested && limit !== 'all' ? Math.ceil(total / limitNum) || 1 : 1,
      limit: limitNum,
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

// @desc    Get all applications / join requests for admin
// @route   GET /api/admin/applications
// @access  Private (Admin only)
const getAllApplications = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;

    let query = {};
    if (status && status !== 'All') {
      query.status = status.toLowerCase();
    }

    const applications = await JoinRequest.find(query)
      .populate('student', 'name rollNumber email department year gender skills bio')
      .populate({
        path: 'team',
        select: 'teamName hackathon problemDomain status leader requiredMembers members',
        populate: {
          path: 'leader',
          select: 'name rollNumber email department',
        },
      })
      .sort({ createdAt: -1 });

    let filtered = applications;
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = applications.filter((app) => {
        const studentName = app.student?.name?.toLowerCase() || '';
        const rollNumber = app.student?.rollNumber?.toLowerCase() || '';
        const email = app.student?.email?.toLowerCase() || '';
        const teamName = app.team?.teamName?.toLowerCase() || '';
        const leaderName = app.team?.leader?.name?.toLowerCase() || '';
        const problemDomain = app.team?.problemDomain?.toLowerCase() || '';
        return (
          studentName.includes(s) ||
          rollNumber.includes(s) ||
          email.includes(s) ||
          teamName.includes(s) ||
          leaderName.includes(s) ||
          problemDomain.includes(s)
        );
      });
    }

    const total = filtered.length;
    const isPaginationRequested = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = limit === 'all' ? total : Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    let paginatedApplications = filtered;
    if (isPaginationRequested && limit !== 'all') {
      const skip = (pageNum - 1) * limitNum;
      paginatedApplications = filtered.slice(skip, skip + limitNum);
    }

    res.json({
      success: true,
      count: paginatedApplications.length,
      total,
      page: pageNum,
      totalPages: isPaginationRequested && limit !== 'all' ? Math.ceil(total / limitNum) || 1 : 1,
      limit: limitNum,
      applications: paginatedApplications,
    });
  } catch (error) {
    console.error('Admin applications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Flag or unflag a student/user
// @route   PUT /api/admin/users/:userId/flag
// @access  Private (Admin only)
const toggleUserFlag = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isFlagged, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot flag an administrator/coordinator account' });
    }

    user.isFlagged = Boolean(isFlagged);
    user.flagReason = user.isFlagged
      ? (reason ? reason.trim() : 'Flagged by faculty coordinator for verification')
      : '';
    user.flaggedAt = user.isFlagged ? new Date() : null;

    await user.save();
    invalidateRosterCache();

    res.json({
      success: true,
      message: user.isFlagged
        ? `Student ${user.name} (${user.rollNumber}) has been flagged: "${user.flagReason}"`
        : `Student ${user.name} has been unflagged and restored to good standing.`,
      user: {
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        email: user.email,
        isFlagged: user.isFlagged,
        flagReason: user.flagReason,
        flaggedAt: user.flaggedAt,
      },
    });
  } catch (error) {
    console.error('Toggle user flag error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Flag or unflag a team
// @route   PUT /api/admin/teams/:teamId/flag
// @access  Private (Admin only)
const toggleTeamFlag = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { isFlagged, reason } = req.body;

    const team = await Team.findById(teamId)
      .populate('leader', 'name rollNumber email')
      .populate('members', 'name rollNumber email');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    team.isFlagged = Boolean(isFlagged);
    team.flagReason = team.isFlagged
      ? (reason ? reason.trim() : 'Flagged by faculty coordinator for review')
      : '';
    team.flaggedAt = team.isFlagged ? new Date() : null;

    await team.save();
    invalidateRosterCache();

    res.json({
      success: true,
      message: team.isFlagged
        ? `Team "${team.teamName}" has been flagged: "${team.flagReason}"`
        : `Team "${team.teamName}" has been unflagged and restored to good standing.`,
      team,
    });
  } catch (error) {
    console.error('Toggle team flag error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a team (Admin permanent deletion)
// @route   DELETE /api/admin/teams/:teamId
// @access  Private (Admin only)
const deleteTeamByAdmin = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const teamName = team.teamName;

    // Delete all join requests related to this team
    await JoinRequest.deleteMany({ team: team._id });

    // Delete the team document
    await Team.findByIdAndDelete(team._id);
    invalidateRosterCache();

    res.json({
      success: true,
      message: `Team "${teamName}" and all associated join requests have been permanently deleted.`,
    });
  } catch (error) {
    console.error('Admin delete team error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a student account (Admin permanent deletion)
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin only)
const deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete an administrator account' });
    }

    const studentName = user.name;
    const studentRoll = user.rollNumber;

    // 1. Remove user from team memberships
    await Team.updateMany(
      { members: user._id },
      { $pull: { members: user._id } }
    );

    // 2. For teams where user is leader: if they were sole member, delete team; otherwise reassign leader to next member
    const leadingTeams = await Team.find({ leader: user._id });
    for (const lt of leadingTeams) {
      if (lt.members.length === 0) {
        await JoinRequest.deleteMany({ team: lt._id });
        await Team.findByIdAndDelete(lt._id);
      } else {
        lt.leader = lt.members[0];
        await lt.save();
      }
    }

    // 3. Remove all join requests by this student
    await JoinRequest.deleteMany({ student: user._id });

    // 4. Delete the user
    await User.findByIdAndDelete(user._id);
    invalidateRosterCache();

    res.json({
      success: true,
      message: `Student account ${studentName} (${studentRoll}) has been permanently deleted.`,
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an application (Admin deletion)
// @route   DELETE /api/admin/applications/:applicationId
// @access  Private (Admin only)
const deleteApplicationByAdmin = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const app = await JoinRequest.findById(applicationId);

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await JoinRequest.findByIdAndDelete(applicationId);

    res.json({
      success: true,
      message: 'Application record has been deleted.',
    });
  } catch (error) {
    console.error('Admin delete application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// In-memory cache for admin roster with TTL
let rosterCache = {
  data: null,
  timestamp: 0,
};
const ROSTER_CACHE_TTL = 30 * 1000; // 30 seconds server cache TTL

const invalidateRosterCache = () => {
  rosterCache = { data: null, timestamp: 0 };
};

// @desc    Get comprehensive roster: all students mapped with teams, and all teams with member rosters
// @route   GET /api/admin/roster
// @access  Private (Admin only)
const getAdminRoster = async (req, res) => {
  try {
    const { refresh } = req.query;
    const now = Date.now();

    if (!refresh && rosterCache.data && now - rosterCache.timestamp < ROSTER_CACHE_TTL) {
      return res.json({
        success: true,
        cached: true,
        cachedAt: new Date(rosterCache.timestamp).toISOString(),
        ...rosterCache.data,
      });
    }

    const [students, teams] = await Promise.all([
      User.find({ role: 'student' })
        .select('-password')
        .sort({ name: 1 })
        .lean(),
      Team.find()
        .populate('leader', 'name rollNumber email department year gender skills isFlagged')
        .populate('members', 'name rollNumber email department year gender skills isFlagged')
        .sort({ teamName: 1 })
        .lean(),
    ]);

    // Build a lookup map of student ID -> Array of teams with their role in that team
    const studentTeamMap = {};

    // Process teams and member rosters
    const enrichedTeams = teams.map((team) => {
      const leaderId = team.leader?._id ? team.leader._id.toString() : (team.leader ? team.leader.toString() : null);
      const members = team.members || [];
      const memberCount = members.length;
      const isFull = memberCount >= (team.requiredMembers || 6);

      // Check if team has at least one female member
      const hasFemale = members.some((m) => m && m.gender === 'Female') || (team.leader && team.leader.gender === 'Female');

      // Tag members
      members.forEach((m) => {
        if (!m || !m._id) return;
        const mId = m._id.toString();
        const role = mId === leaderId ? 'Leader' : 'Member';

        if (!studentTeamMap[mId]) {
          studentTeamMap[mId] = [];
        }
        studentTeamMap[mId].push({
          teamId: team._id,
          teamName: team.teamName,
          hackathon: team.hackathon,
          problemDomain: team.problemDomain,
          status: team.status,
          role,
          isFull,
          requiredMembers: team.requiredMembers || 6,
          memberCount,
          isFlagged: team.isFlagged,
        });
      });

      // Ensure leader is counted if not already in studentTeamMap for this team
      if (leaderId && (!studentTeamMap[leaderId] || !studentTeamMap[leaderId].some((t) => t.teamId.toString() === team._id.toString()))) {
        if (!studentTeamMap[leaderId]) {
          studentTeamMap[leaderId] = [];
        }
        studentTeamMap[leaderId].push({
          teamId: team._id,
          teamName: team.teamName,
          hackathon: team.hackathon,
          problemDomain: team.problemDomain,
          status: team.status,
          role: 'Leader',
          isFull,
          requiredMembers: team.requiredMembers || 6,
          memberCount,
          isFlagged: team.isFlagged,
        });
      }

      return {
        ...team,
        memberCount,
        isFull,
        hasFemale,
      };
    });

    // Enrich students with their assigned teams
    const enrichedStudents = students.map((student) => {
      const sId = student._id.toString();
      const assignedTeams = studentTeamMap[sId] || [];
      const isAssigned = assignedTeams.length > 0;
      const primaryTeam = assignedTeams[0] || null;

      return {
        ...student,
        teams: assignedTeams,
        isAssigned,
        teamName: primaryTeam ? primaryTeam.teamName : null,
        teamRole: primaryTeam ? primaryTeam.role : null,
        primaryTeam,
      };
    });

    const unassignedStudents = enrichedStudents.filter((s) => !s.isAssigned);
    const assignedStudents = enrichedStudents.filter((s) => s.isAssigned);

    const stats = {
      totalStudents: enrichedStudents.length,
      assignedStudents: assignedStudents.length,
      unassignedStudents: unassignedStudents.length,
      totalTeams: enrichedTeams.length,
      fullTeams: enrichedTeams.filter((t) => t.isFull).length,
      recruitingTeams: enrichedTeams.filter((t) => !t.isFull).length,
      sihTeams: enrichedTeams.filter((t) => /sih|smart india/i.test(t.hackathon || '')).length,
    };

    const responsePayload = {
      stats,
      students: enrichedStudents,
      teams: enrichedTeams,
      unassignedCount: unassignedStudents.length,
    };

    // Store in cache
    rosterCache = {
      data: responsePayload,
      timestamp: now,
    };

    res.json({
      success: true,
      cached: false,
      cachedAt: new Date(now).toISOString(),
      ...responsePayload,
    });
  } catch (error) {
    console.error('Admin get roster error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
  invalidateRosterCache,
};

