const Team = require('../models/Team');
const JoinRequest = require('../models/JoinRequest');

const escapeRegex = (str) => (str || '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const {
      teamName,
      hackathon,
      problemDomain,
      description,
      requiredMembers,
      skillsNeeded,
      requirements,
    } = req.body;

    if (!teamName || !hackathon || !problemDomain) {
      return res.status(400).json({
        success: false,
        message: 'Please provide team name, hackathon, and problem/domain',
      });
    }

    const trimmedHackathon = hackathon.trim();

    // Check if user is already leading or a member of a team for the same hackathon
    const existingParticipation = await Team.findOne({
      hackathon: { $regex: new RegExp(`^${escapeRegex(trimmedHackathon)}$`, 'i') },
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    });

    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: `You are already part of team "${existingParticipation.teamName}" for ${trimmedHackathon}. You cannot create or join multiple teams for the same hackathon.`,
      });
    }

    // Parse skills
    let parsedSkills = [];
    if (Array.isArray(skillsNeeded)) {
      parsedSkills = skillsNeeded.map((s) => s.trim()).filter(Boolean);
    } else if (typeof skillsNeeded === 'string' && skillsNeeded.trim()) {
      parsedSkills = skillsNeeded.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const team = await Team.create({
      teamName: teamName.trim(),
      hackathon: trimmedHackathon,
      problemDomain: problemDomain.trim(),
      description: description ? description.trim() : '',
      requiredMembers: Number(requiredMembers) || 6,
      leader: req.user._id,
      members: [req.user._id], // Team leader is the first member
      skillsNeeded: parsedSkills,
      requirements: {
        femaleRequired: requirements?.femaleRequired ?? true,
        targetDepartment: requirements?.targetDepartment || 'Any',
        targetYear: requirements?.targetYear || 'Any',
        otherRequirements: requirements?.otherRequirements || '',
      },
      status: (Number(requiredMembers) || 6) <= 1 ? 'full' : 'open',
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills');

    res.status(201).json({
      success: true,
      message: 'Team created successfully!',
      team: populatedTeam,
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating team',
    });
  }
};

// @desc    Get all teams with filters & search
// @route   GET /api/teams
// @access  Public
const getTeams = async (req, res) => {
  try {
    const { hackathon, department, year, genderReq, status, search, skill, page, limit } = req.query;

    // Exclude flagged fake/spam teams from public catalog
    let query = { isFlagged: { $ne: true } };

    if (hackathon && hackathon !== 'All') {
      if (hackathon.toLowerCase().includes('sih') || hackathon.toLowerCase().includes('smart india')) {
        query.hackathon = { $regex: /sih|smart india/i };
      } else {
        query.hackathon = { $regex: new RegExp(hackathon.trim(), 'i') };
      }
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (genderReq === 'true' || genderReq === true) {
      query['requirements.femaleRequired'] = true;
    }

    if (department && department !== 'All') {
      query['requirements.targetDepartment'] = { $in: [department, 'Any'] };
    }

    if (year && year !== 'All') {
      query['requirements.targetYear'] = { $in: [year, 'Any'] };
    }

    if (skill && skill !== 'All') {
      query.skillsNeeded = { $regex: new RegExp(skill.trim(), 'i') };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { teamName: searchRegex },
        { problemDomain: searchRegex },
        { description: searchRegex },
        { skillsNeeded: searchRegex },
      ];
    }

    const total = await Team.countDocuments(query);

    let teamsQuery = Team.find(query)
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills')
      .sort({ createdAt: -1 });

    // Handle pagination if page or limit is provided
    const isPaginationRequested = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = limit === 'all' ? total : Math.min(100, Math.max(1, parseInt(limit, 10) || 9));

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
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching teams',
    });
  }
};

// @desc    Get single team by ID
// @route   GET /api/teams/:id
// @access  Public
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name rollNumber email department year gender skills bio')
      .populate('members', 'name rollNumber email department year gender skills bio');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.json({
      success: true,
      team,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update team details
// @route   PUT /api/teams/:id
// @access  Private (Team Leader)
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the team leader can edit this team' });
    }

    const {
      teamName,
      problemDomain,
      description,
      requiredMembers,
      skillsNeeded,
      requirements,
      status,
    } = req.body;

    if (teamName) team.teamName = teamName.trim();
    if (problemDomain) team.problemDomain = problemDomain.trim();
    if (description !== undefined) team.description = description.trim();
    if (requiredMembers) team.requiredMembers = Number(requiredMembers);
    if (status) team.status = status;

    if (skillsNeeded !== undefined) {
      if (Array.isArray(skillsNeeded)) {
        team.skillsNeeded = skillsNeeded.map((s) => s.trim()).filter(Boolean);
      } else if (typeof skillsNeeded === 'string') {
        team.skillsNeeded = skillsNeeded.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    if (requirements) {
      team.requirements = {
        femaleRequired: requirements.femaleRequired ?? team.requirements.femaleRequired,
        targetDepartment: requirements.targetDepartment || team.requirements.targetDepartment,
        targetYear: requirements.targetYear || team.requirements.targetYear,
        otherRequirements: requirements.otherRequirements !== undefined ? requirements.otherRequirements : team.requirements.otherRequirements,
      };
    }

    // Recalculate status based on member count
    if (team.members.length >= team.requiredMembers && team.status === 'open') {
      team.status = 'full';
    } else if (team.members.length < team.requiredMembers && team.status === 'full') {
      team.status = 'open';
    }

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills');

    res.json({
      success: true,
      message: 'Team updated successfully',
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a member from team
// @route   DELETE /api/teams/:id/members/:memberId
// @access  Private (Team Leader)
const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const isLeader = team.leader.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isLeader && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the team leader or admin can remove members' });
    }

    const memberIdToRemove = req.params.memberId;

    if (memberIdToRemove === team.leader.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove the team leader. Delete the team instead.' });
    }

    team.members = team.members.filter((m) => m.toString() !== memberIdToRemove);

    if (team.members.length < team.requiredMembers && team.status === 'full') {
      team.status = 'open';
    }

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills');

    res.json({
      success: true,
      message: 'Member removed successfully',
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Team Leader or Admin)
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this team' });
    }

    await JoinRequest.deleteMany({ team: team._id });
    await Team.findByIdAndDelete(team._id);

    res.json({
      success: true,
      message: 'Team and associated requests deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's teams (as leader or member)
// @route   GET /api/teams/my-teams
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    const leadingTeams = await Team.find({ leader: req.user._id })
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills')
      .sort({ createdAt: -1 });

    const memberTeams = await Team.find({
      leader: { $ne: req.user._id },
      members: req.user._id,
    })
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      leadingTeams,
      memberTeams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  removeMember,
  deleteTeam,
  getMyTeams,
};
