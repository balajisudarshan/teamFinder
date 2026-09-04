const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Team = require('../models/Team');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'teamfinder_super_secret_jwt_key_nbkrist_2025',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    let { name, rollNumber, email, password, department, year, gender, skills, bio } = req.body;

    if (!name || !rollNumber || !email || !password || !department || !year || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (name, roll number, email, password, department, year, gender)',
      });
    }

    email = email.trim().toLowerCase();
    rollNumber = rollNumber.trim().toUpperCase();

    // Strict NBKRIST domain verification
    if (!email.endsWith('@nbkrist.org')) {
      return res.status(400).json({
        success: false,
        message: 'Registration is restricted strictly to NBKRIST students. Email must end with @nbkrist.org',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    const rollExists = await User.findOne({ rollNumber });
    if (rollExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this roll number already exists',
      });
    }

    // Parse skills if string
    let parsedSkills = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills.map((s) => s.trim()).filter(Boolean);
    } else if (typeof skills === 'string' && skills.trim()) {
      parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const user = await User.create({
      name: name.trim(),
      rollNumber,
      email,
      password,
      department,
      year,
      gender,
      skills: parsedSkills,
      bio: bio ? bio.trim() : '',
      role: (req.body.role === 'admin' || email === '24kb1a0517@nbkrist.org' || email === 'admin@nbkrist.org' || email === 'coordinator@nbkrist.org') ? 'admin' : 'student',
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        email: user.email,
        department: user.department,
        year: user.year,
        gender: user.gender,
        skills: user.skills,
        bio: user.bio,
        role: user.role,
        isFlagged: user.isFlagged || false,
        flagReason: user.flagReason || '',
        flaggedAt: user.flaggedAt || null,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const myTeam = await Team.findOne({ members: user._id }).select('teamName hackathon isFlagged flagReason flaggedAt leader');

    res.json({
      success: true,
      message: 'Logged in successfully',
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        email: user.email,
        department: user.department,
        year: user.year,
        gender: user.gender,
        skills: user.skills,
        bio: user.bio,
        role: user.role,
        isFlagged: user.isFlagged || false,
        flagReason: user.flagReason || '',
        flaggedAt: user.flaggedAt || null,
        team: myTeam ? {
          _id: myTeam._id,
          teamName: myTeam.teamName,
          hackathon: myTeam.hackathon,
          isFlagged: Boolean(myTeam.isFlagged),
          flagReason: myTeam.flagReason || '',
          flaggedAt: myTeam.flaggedAt || null,
          isLeader: myTeam.leader?.toString() === user._id.toString(),
        } : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const myTeam = await Team.findOne({ members: user._id }).select('teamName hackathon isFlagged flagReason flaggedAt leader');

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        team: myTeam ? {
          _id: myTeam._id,
          teamName: myTeam.teamName,
          hackathon: myTeam.hackathon,
          isFlagged: Boolean(myTeam.isFlagged),
          flagReason: myTeam.flagReason || '',
          flaggedAt: myTeam.flaggedAt || null,
          isLeader: myTeam.leader?.toString() === user._id.toString(),
        } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, department, year, gender, skills, bio } = req.body;

    if (name) user.name = name.trim();
    if (department) user.department = department;
    if (year) user.year = year;
    if (gender) user.gender = gender;
    if (bio !== undefined) user.bio = bio.trim();

    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        user.skills = skills.map((s) => s.trim()).filter(Boolean);
      } else if (typeof skills === 'string') {
        user.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        rollNumber: updatedUser.rollNumber,
        email: updatedUser.email,
        department: updatedUser.department,
        year: updatedUser.year,
        gender: updatedUser.gender,
        skills: updatedUser.skills,
        bio: updatedUser.bio,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
