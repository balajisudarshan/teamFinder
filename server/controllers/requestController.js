const JoinRequest = require('../models/JoinRequest');
const Team = require('../models/Team');

const escapeRegex = (str) => (str || '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// @desc    Send a request to join a team
// @route   POST /api/requests/:teamId
// @access  Private
const sendJoinRequest = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Check if team is full
    if (team.members.length >= team.requiredMembers) {
      return res.status(400).json({ success: false, message: 'This team is already complete / full' });
    }

    // Check if user is already in this team
    if (team.members.some((m) => m.toString() === userId.toString())) {
      return res.status(400).json({ success: false, message: 'You are already a member of this team' });
    }

    // Crucial check: Is user already leading or a member of ANY team for this hackathon?
    const existingParticipation = await Team.findOne({
      hackathon: { $regex: new RegExp(`^${escapeRegex(team.hackathon)}$`, 'i') },
      $or: [{ leader: userId }, { members: userId }],
    });

    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: `You are already part of team "${existingParticipation.teamName}" for ${team.hackathon}. A student cannot join multiple teams for the same hackathon.`,
      });
    }

    // Check if pending request already exists
    const existingPending = await JoinRequest.findOne({
      team: teamId,
      student: userId,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending join request for this team',
      });
    }

    const joinRequest = await JoinRequest.create({
      team: teamId,
      student: userId,
      message: message ? message.trim() : '',
      status: 'pending',
    });

    const populatedRequest = await JoinRequest.findById(joinRequest._id)
      .populate('student', 'name rollNumber email department year gender skills bio')
      .populate('team', 'teamName hackathon');

    res.status(201).json({
      success: true,
      message: 'Join request sent successfully!',
      request: populatedRequest,
    });
  } catch (error) {
    console.error('Send join request error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get all requests for a specific team (Leader only)
// @route   GET /api/requests/team/:teamId
// @access  Private (Team Leader)
const getTeamRequests = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the team leader can view team requests' });
    }

    const requests = await JoinRequest.find({ team: teamId })
      .populate('student', 'name rollNumber email department year gender skills bio')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept or reject a join request
// @route   PUT /api/requests/:requestId
// @access  Private (Team Leader)
const respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "accept" or "reject"' });
    }

    const request = await JoinRequest.findById(requestId).populate('student');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${request.status}`,
      });
    }

    const team = await Team.findById(request.team);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team no longer exists' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the team leader can respond to requests' });
    }

    if (action === 'reject') {
      request.status = 'rejected';
      await request.save();

      return res.json({
        success: true,
        message: 'Request rejected',
        request,
      });
    }

    // Action is 'accept'
    if (team.members.length >= team.requiredMembers) {
      return res.status(400).json({
        success: false,
        message: 'Team is already full! Cannot accept more members.',
      });
    }

    // Check if the student joined another team for this hackathon in the meantime
    const otherTeam = await Team.findOne({
      _id: { $ne: team._id },
      hackathon: { $regex: new RegExp(`^${escapeRegex(team.hackathon)}$`, 'i') },
      $or: [{ leader: request.student._id }, { members: request.student._id }],
    });

    if (otherTeam) {
      request.status = 'rejected';
      await request.save();
      return res.status(400).json({
        success: false,
        message: `Student ${request.student.name} has already joined another team ("${otherTeam.teamName}") for ${team.hackathon}.`,
      });
    }

    // Add student to members
    if (!team.members.includes(request.student._id)) {
      team.members.push(request.student._id);
    }

    if (team.members.length >= team.requiredMembers) {
      team.status = 'full';
    }

    await team.save();

    request.status = 'accepted';
    await request.save();

    // Invalidate any other pending requests from this student for this hackathon
    const sameHackathonTeams = await Team.find({
      hackathon: { $regex: new RegExp(`^${escapeRegex(team.hackathon)}$`, 'i') },
    }).select('_id');

    const sameHackathonTeamIds = sameHackathonTeams.map((t) => t._id);

    await JoinRequest.updateMany(
      {
        _id: { $ne: request._id },
        student: request.student._id,
        team: { $in: sameHackathonTeamIds },
        status: 'pending',
      },
      { status: 'rejected' }
    );

    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills');

    res.json({
      success: true,
      message: `${request.student.name} has been added to ${team.teamName}!`,
      request,
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's sent join requests
// @route   GET /api/requests/my-requests
// @access  Private
const getMyRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find({ student: req.user._id })
      .populate({
        path: 'team',
        select: 'teamName hackathon problemDomain status leader requiredMembers members',
        populate: {
          path: 'leader',
          select: 'name rollNumber email department',
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendJoinRequest,
  getTeamRequests,
  respondToRequest,
  getMyRequests,
};
