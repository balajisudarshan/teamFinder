const JoinRequest = require('../models/JoinRequest');
const Team = require('../models/Team');
const User = require('../models/User');
const { emitToUser } = require('../socket');

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

    // Check if team is flagged
    if (team.isFlagged) {
      return res.status(403).json({
        success: false,
        message: `This team has been flagged by the faculty coordinator: "${team.flagReason}". New applications cannot be submitted to flagged teams.`,
      });
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

    // Real-time socket notification to team leader
    emitToUser(team.leader, 'new_join_request', {
      title: `New Application for ${team.teamName}`,
      message: `${req.user.name} (${req.user.rollNumber}) applied to join your team.`,
      request: populatedRequest,
      team: { _id: team._id, teamName: team.teamName },
      createdAt: new Date(),
    });

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

    // Real-time socket notification to student
    emitToUser(request.student._id, 'request_response', {
      title: action === 'accept' ? 'Application Accepted! 🎉' : 'Application Update',
      message: action === 'accept'
        ? `Congratulations! You have been accepted into team "${team.teamName}"!`
        : `Your application to join "${team.teamName}" was not accepted.`,
      action,
      team: { _id: team._id, teamName: team.teamName },
      createdAt: new Date(),
    });

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
    const requests = await JoinRequest.find({ student: req.user._id, type: { $ne: 'invitation' } })
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

// Safe reference to invalidateRosterCache
let invalidateRosterCache = () => {};
try {
  const adminController = require('./adminController');
  if (adminController && adminController.invalidateRosterCache) {
    invalidateRosterCache = adminController.invalidateRosterCache;
  }
} catch (e) {}

// @desc    Send a team invitation to an unallocated student (Team Leader or Admin)
// @route   POST /api/requests/invite
// @access  Private (Team Leader or Admin)
const sendTeamInvitation = async (req, res) => {
  try {
    const { teamId, studentId, message } = req.body;

    if (!teamId || !studentId) {
      return res.status(400).json({ success: false, message: 'Please provide team ID and student ID' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Target team not found' });
    }

    // Check if team is flagged
    if (team.isFlagged) {
      return res.status(403).json({
        success: false,
        message: `This team has been flagged by coordinator: "${team.flagReason}". Cannot send invitations.`,
      });
    }

    // Permission: caller must be leader of this team or admin
    const isLeader = team.leader.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isLeader && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the team leader (or administrator) can invite members to this team',
      });
    }

    // Check if team is already full
    const reqMembers = team.requiredMembers || 6;
    if (team.members.length >= reqMembers) {
      return res.status(400).json({
        success: false,
        message: `Team "${team.teamName}" is already full (${team.members.length}/${reqMembers} members). Cannot invite more candidates.`,
      });
    }

    // Target student check
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ success: false, message: 'Invitations can only be sent to registered students' });
    }

    // Check if student is already a member of this team
    if (team.members.some((m) => m.toString() === studentId.toString())) {
      return res.status(400).json({
        success: false,
        message: `Student ${student.name} is already a member of this team`,
      });
    }

    // Check if student is already leading or a member of ANY team for this hackathon
    const existingParticipation = await Team.findOne({
      hackathon: { $regex: new RegExp(`^${escapeRegex(team.hackathon)}$`, 'i') },
      $or: [{ leader: studentId }, { members: studentId }],
    });

    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: `Student ${student.name} is already part of team "${existingParticipation.teamName}" for ${team.hackathon}. Only unallocated students can be invited.`,
      });
    }

    // Check if duplicate pending invitation exists
    const existingInvite = await JoinRequest.findOne({
      team: teamId,
      student: studentId,
      type: 'invitation',
      status: 'pending',
    });

    if (existingInvite) {
      return res.status(400).json({
        success: false,
        message: `An invitation is already pending for ${student.name} to join "${team.teamName}".`,
      });
    }

    const invitation = await JoinRequest.create({
      team: teamId,
      student: studentId,
      message: message ? message.trim() : `You have been invited to join team ${team.teamName} for ${team.hackathon}.`,
      type: 'invitation',
      sender: req.user._id,
      status: 'pending',
    });

    const populatedInvite = await JoinRequest.findById(invitation._id)
      .populate('student', 'name rollNumber email department year gender skills')
      .populate('team', 'teamName hackathon problemDomain leader requiredMembers members')
      .populate('sender', 'name rollNumber email');

    invalidateRosterCache();

    // Real-time socket notification to invited student
    emitToUser(studentId, 'new_invitation', {
      title: `Team Invitation: ${team.teamName}`,
      message: populatedInvite.message || `You have been invited to join team "${team.teamName}".`,
      invitation: populatedInvite,
      team: {
        _id: team._id,
        teamName: team.teamName,
        hackathon: team.hackathon,
        problemDomain: team.problemDomain,
      },
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `Invitation successfully sent to ${student.name} (${student.rollNumber})!`,
      invitation: populatedInvite,
    });
  } catch (error) {
    console.error('Send team invitation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send invitation' });
  }
};

// @desc    Get all invitations sent to currently logged-in student
// @route   GET /api/requests/my/invitations
// @access  Private (Student)
const getMyInvitations = async (req, res) => {
  try {
    const invitations = await JoinRequest.find({
      student: req.user._id,
      type: 'invitation',
    })
      .populate({
        path: 'team',
        select: 'teamName hackathon problemDomain status leader requiredMembers members skillsNeeded description',
        populate: {
          path: 'leader',
          select: 'name rollNumber email department',
        },
      })
      .populate('sender', 'name rollNumber email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invitations,
    });
  } catch (error) {
    console.error('Get my invitations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to an invitation (Student accepts or declines)
// @route   PUT /api/requests/invitations/:inviteId/respond
// @access  Private (Student recipient)
const respondToInvitation = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "accept" or "reject"' });
    }

    const invitation = await JoinRequest.findById(inviteId);
    if (!invitation || invitation.type !== 'invitation') {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    // Verify recipient
    if (invitation.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only respond to your own invitations' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status}`,
      });
    }

    const team = await Team.findById(invitation.team);
    if (!team) {
      invitation.status = 'rejected';
      await invitation.save();
      return res.status(404).json({ success: false, message: 'Team no longer exists' });
    }

    if (action === 'reject') {
      invitation.status = 'rejected';
      await invitation.save();
      return res.json({
        success: true,
        message: `Declined invitation from "${team.teamName}"`,
        invitation,
      });
    }

    // Action is 'accept'
    // 1. Verify team is not full
    const reqMembers = team.requiredMembers || 6;
    if (team.members.length >= reqMembers) {
      invitation.status = 'rejected';
      await invitation.save();
      return res.status(400).json({
        success: false,
        message: `Team "${team.teamName}" is already full! Cannot join.`,
      });
    }

    // 2. Verify student hasn't joined another team for this hackathon
    const otherTeam = await Team.findOne({
      _id: { $ne: team._id },
      hackathon: { $regex: new RegExp(`^${escapeRegex(team.hackathon)}$`, 'i') },
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    });

    if (otherTeam) {
      invitation.status = 'rejected';
      await invitation.save();
      return res.status(400).json({
        success: false,
        message: `You are already part of team "${otherTeam.teamName}" for ${team.hackathon}. Cannot accept multiple teams.`,
      });
    }

    // 3. Add student to team
    if (!team.members.some((m) => m.toString() === req.user._id.toString())) {
      team.members.push(req.user._id);
    }

    if (team.members.length >= reqMembers) {
      team.status = 'full';
    }

    await team.save();

    invitation.status = 'accepted';
    await invitation.save();

    // 4. Invalidate other pending applications and invitations for this student for this hackathon
    const sameHackathonTeams = await Team.find({
      hackathon: { $regex: new RegExp(`^${escapeRegex(team.hackathon)}$`, 'i') },
    }).select('_id');
    const sameHackathonIds = sameHackathonTeams.map((t) => t._id);

    await JoinRequest.updateMany(
      {
        _id: { $ne: invitation._id },
        student: req.user._id,
        team: { $in: sameHackathonIds },
        status: 'pending',
      },
      { status: 'rejected' }
    );

    invalidateRosterCache();

    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name rollNumber email department year gender skills')
      .populate('members', 'name rollNumber email department year gender skills');

    // Real-time socket notification to team leader
    emitToUser(team.leader, 'invitation_response', {
      title: action === 'accept' ? 'Invitation Accepted! 🤝' : 'Invitation Declined',
      message: `${req.user.name} (${req.user.rollNumber}) has ${action === 'accept' ? 'accepted' : 'declined'} your invitation to join "${team.teamName}".`,
      action,
      student: { _id: req.user._id, name: req.user.name, rollNumber: req.user.rollNumber },
      team: { _id: team._id, teamName: team.teamName },
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `Congratulations! You have joined team "${team.teamName}"!`,
      invitation,
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all invitations sent for a specific team (Leader or Admin)
// @route   GET /api/requests/team/:teamId/invitations
// @access  Private (Leader or Admin)
const getTeamInvitations = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only team leader can view team invitations' });
    }

    const invitations = await JoinRequest.find({
      team: teamId,
      type: 'invitation',
    })
      .populate('student', 'name rollNumber email department year gender skills')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invitations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students not allocated to any team for a hackathon
// @route   GET /api/requests/unallocated
// @access  Private (Authenticated users)
const getUnallocatedStudents = async (req, res) => {
  try {
    const { hackathon, department, search } = req.query;

    let teamQuery = {};
    if (hackathon && hackathon !== 'All') {
      teamQuery.hackathon = { $regex: new RegExp(`^${escapeRegex(hackathon.trim())}$`, 'i') };
    }

    const teams = await Team.find(teamQuery).select('leader members');
    const assignedIds = new Set();
    teams.forEach((t) => {
      if (t.leader) assignedIds.add(t.leader.toString());
      (t.members || []).forEach((m) => {
        if (m) assignedIds.add(m.toString());
      });
    });

    let studentQuery = {
      role: 'student',
      _id: { $nin: Array.from(assignedIds) },
    };

    if (department && department !== 'All') {
      studentQuery.department = department;
    }

    if (search && search.trim()) {
      const q = new RegExp(search.trim(), 'i');
      studentQuery.$or = [
        { name: q },
        { rollNumber: q },
        { email: q },
        { skills: q },
      ];
    }

    const students = await User.find(studentQuery)
      .select('name rollNumber email department year gender skills isFlagged bio')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error('Get unallocated students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get consolidated notifications and pending counts for user
// @route   GET /api/requests/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Pending invitations received by this user
    const pendingInvitations = await JoinRequest.find({
      student: userId,
      type: 'invitation',
      status: 'pending',
    })
      .populate('team', 'teamName hackathon problemDomain leader requiredMembers members')
      .populate('sender', 'name rollNumber email')
      .sort({ createdAt: -1 });

    // 2. Pending applications to teams led by this user
    const myLeadingTeams = await Team.find({ leader: userId }).select('_id');
    const leadingTeamIds = myLeadingTeams.map((t) => t._id);

    const pendingRequests = await JoinRequest.find({
      team: { $in: leadingTeamIds },
      type: { $ne: 'invitation' },
      status: 'pending',
    })
      .populate('student', 'name rollNumber email department year gender skills')
      .populate('team', 'teamName hackathon problemDomain')
      .sort({ createdAt: -1 });

    const totalUnread = pendingInvitations.length + pendingRequests.length;

    res.json({
      success: true,
      pendingInvitations,
      pendingRequests,
      totalUnread,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};

