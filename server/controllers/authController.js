const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Team = require('../models/Team');
const Otp = require('../models/Otp');
const { sendRegistrationOtpEmail, sendForgotPasswordOtpEmail } = require('../utils/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'teamfinder_super_secret_jwt_key_nbkrist_2025',
    { expiresIn: '30d' }
  );
};

const deduceDepartment = (rollNumber) => {
  if (!rollNumber || rollNumber.length < 8) return 'CSE';
  const branch = rollNumber.substring(6, 8).toUpperCase();
  const map = {
    '05': 'CSE',
    '04': 'ECE',
    '02': 'EEE',
    '03': 'MECH',
    '01': 'CIVIL',
    '42': 'AI&DS',
    '12': 'IT',
  };
  return map[branch] || 'CSE';
};

const deduceYear = (rollNumber) => {
  if (!rollNumber || rollNumber.length < 2) return '1st Year';
  const prefix = rollNumber.substring(0, 2);
  const isLateral = rollNumber.length >= 6 && rollNumber.substring(4, 6).toUpperCase() === '5A';
  if (prefix === '22') return '4th Year';
  if (prefix === '23') return isLateral ? '4th Year' : '3rd Year';
  if (prefix === '24') return isLateral ? '3rd Year' : '2nd Year';
  if (prefix === '25') return isLateral ? '3rd Year' : '1st Year';
  if (prefix === '26') return isLateral ? '2nd Year' : '1st Year';
  return '1st Year';
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    let { name, rollNumber, email, password, department, year, gender, skills, bio } = req.body;

    if (rollNumber && !email) {
      email = `${rollNumber.trim().toLowerCase()}@nbkrist.org`;
    }

    if (!name || !rollNumber || !email || !password || !department || !year || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (name, roll number, password, department, year, gender)',
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
        message: 'Please provide both roll number / email and password',
      });
    }

    const identifier = email.trim().toLowerCase();
    const candidateEmail = identifier.includes('@') ? identifier : `${identifier}@nbkrist.org`;
    const candidateRoll = identifier.toUpperCase();

    const user = await User.findOne({
      $or: [
        { email: candidateEmail },
        { rollNumber: candidateRoll },
        { email: identifier },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid roll number / email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid roll number / email or password',
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

// @desc    Authenticate with Google (@nbkrist.org restricted)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google authentication token',
      });
    }

    const email = payload.email.trim().toLowerCase();

    const rollCandidate = email.endsWith('@nbkrist.org')
      ? email.split('@')[0].toUpperCase()
      : null;

    // Match existing account by email, personalEmail, rollNumber, or googleId
    let user = await User.findOne({
      $or: [
        { googleId: payload.sub },
        { personalEmail: email },
        { email },
        ...(rollCandidate ? [{ rollNumber: rollCandidate }] : []),
      ],
    });

    // If new user and not on @nbkrist.org domain, require registering via the Junior tab
    if (!user && !email.endsWith('@nbkrist.org')) {
      return res.status(403).json({
        success: false,
        message: 'This personal Google account is not registered yet. 1st Years / Juniors: please register under the "1st Year / Juniors" tab with your College Roll Number.',
      });
    }

    if (user) {
      // If user has not yet stored googleId, link it
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }
    } else {
      // Auto-register new senior/staff from Google OAuth (@nbkrist.org)
      const department = deduceDepartment(rollCandidate);
      const year = deduceYear(rollCandidate);
      const isAdmin = (
        email === '24kb1a0517@nbkrist.org' ||
        email === 'admin@nbkrist.org' ||
        email === 'coordinator@nbkrist.org'
      );

      user = await User.create({
        name: payload.name || rollCandidate,
        rollNumber: rollCandidate,
        email,
        authProvider: 'google',
        googleId: payload.sub,
        department,
        year,
        gender: 'Other',
        skills: [],
        bio: '',
        role: isAdmin ? 'admin' : 'student',
        isEmailVerified: true,
      });
    }

    const myTeam = await Team.findOne({ members: user._id }).select('teamName hackathon isFlagged flagReason flaggedAt leader');

    res.json({
      success: true,
      message: 'Logged in with Google successfully',
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
        googleId: user.googleId,
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
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
};

// @desc    Register / Authenticate 1st Year / Junior with Google (Any email permitted)
// @route   POST /api/auth/google-junior
// @access  Public
const googleJuniorAuth = async (req, res) => {
  try {
    const { credential, rollNumber, department, year, gender, skills, bio } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google authentication token',
      });
    }

    const personalEmail = payload.email.trim().toLowerCase();

    // Check if user is already registered with this googleId or personalEmail
    let user = await User.findOne({
      $or: [
        { googleId: payload.sub },
        { personalEmail },
      ],
    });

    if (user) {
      // If user exists, ensure googleId is set
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }
    } else {
      // New Junior Registration requires a valid College Roll Number
      if (!rollNumber) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your College Roll Number (e.g. 26KB1A0546) to register your profile.',
        });
      }

      const cleanRoll = rollNumber.trim().toUpperCase();
      const rollRegex = /^[0-9]{2}KB[15]A[0-9]{2}[0-9A-Z]{2}$/i;
      if (!rollRegex.test(cleanRoll)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid NBKRIST roll number format (e.g. 26KB1A0546 for regular or 25KB5A0546 for lateral entry)',
        });
      }

      const collegeEmail = `${cleanRoll.toLowerCase()}@nbkrist.org`;

      // Check if roll number or college email is already registered
      const existingRoll = await User.findOne({
        $or: [{ rollNumber: cleanRoll }, { email: collegeEmail }],
      });

      if (existingRoll) {
        return res.status(400).json({
          success: false,
          message: `Roll number ${cleanRoll} is already registered. If this is your account, please log in with your credentials.`,
        });
      }

      let parsedSkills = [];
      if (Array.isArray(skills)) {
        parsedSkills = skills.map((s) => s.trim()).filter(Boolean);
      } else if (typeof skills === 'string' && skills.trim()) {
        parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      }

      user = await User.create({
        name: (payload.name && payload.name.trim()) || cleanRoll,
        rollNumber: cleanRoll,
        email: collegeEmail,
        personalEmail,
        authProvider: 'google',
        googleId: payload.sub,
        department: department || deduceDepartment(cleanRoll),
        year: year || '1st Year',
        gender: gender || 'Other',
        skills: parsedSkills,
        bio: (bio && bio.trim()) || '',
        role: 'student',
        isEmailVerified: true,
      });
    }

    const myTeam = await Team.findOne({ members: user._id }).select('teamName hackathon isFlagged flagReason flaggedAt leader');

    res.json({
      success: true,
      message: 'Logged in with Google successfully',
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        email: user.email,
        personalEmail: user.personalEmail,
        department: user.department,
        year: user.year,
        gender: user.gender,
        skills: user.skills,
        bio: user.bio,
        role: user.role,
        googleId: user.googleId,
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
    console.error('Google Junior OAuth error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
};

// @desc    Send OTP to personal email for 1st Year / Newcomer Registration
// @route   POST /api/auth/send-otp
// @access  Public
const sendRegistrationOtp = async (req, res) => {
  try {
    const { rollNumber, personalEmail } = req.body;
    if (!rollNumber || !personalEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your university roll number and personal email',
      });
    }

    const cleanRoll = rollNumber.trim().toUpperCase();
    const cleanEmail = personalEmail.trim().toLowerCase();

    // Support both regular (1A) and lateral entry (5A) roll numbers
    const rollRegex = /^[0-9]{2}KB[15]A[0-9]{2}[0-9A-Z]{2}$/i;
    if (!rollRegex.test(cleanRoll)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid NBKRIST roll number format (e.g. 26KB1A0546 for regular or 25KB5A0546 for lateral entry)',
      });
    }

    // Validate personal email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid personal email address (e.g. your Gmail address)',
      });
    }

    const collegeEmail = `${cleanRoll.toLowerCase()}@nbkrist.org`;
    const userExists = await User.findOne({
      $or: [
        { rollNumber: cleanRoll },
        { email: collegeEmail },
        { personalEmail: cleanEmail },
      ],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this roll number or email already exists. Please log in or reset your password.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear old registration OTPs for this roll or email
    await Otp.deleteMany({
      $or: [{ email: cleanEmail }, { rollNumber: cleanRoll }],
      purpose: 'registration',
    });

    await Otp.create({
      email: cleanEmail,
      rollNumber: cleanRoll,
      otp,
      purpose: 'registration',
    });

    await sendRegistrationOtpEmail({ toEmail: cleanEmail, rollNumber: cleanRoll, otp });

    res.json({
      success: true,
      message: `A 6-digit verification code was sent to ${cleanEmail}. It expires in 5 minutes.`,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP email',
    });
  }
};

// @desc    Verify OTP & Complete Newcomer Registration
// @route   POST /api/auth/verify-otp-register
// @access  Public
const verifyOtpAndRegister = async (req, res) => {
  try {
    const { name, rollNumber, personalEmail, otp, password, department, year, gender, skills, bio } = req.body;

    if (!name || !rollNumber || !personalEmail || !otp || !password || !department || !year || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields including the verification code',
      });
    }

    const cleanRoll = rollNumber.trim().toUpperCase();
    const cleanEmail = personalEmail.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      rollNumber: cleanRoll,
      otp: cleanOtp,
      purpose: 'registration',
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new code.',
      });
    }

    const collegeEmail = `${cleanRoll.toLowerCase()}@nbkrist.org`;
    const userExists = await User.findOne({
      $or: [{ rollNumber: cleanRoll }, { email: collegeEmail }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this roll number is already registered.',
      });
    }

    let parsedSkills = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills.map((s) => s.trim()).filter(Boolean);
    } else if (typeof skills === 'string' && skills.trim()) {
      parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const user = await User.create({
      name: name.trim(),
      rollNumber: cleanRoll,
      email: collegeEmail,
      personalEmail: cleanEmail,
      password,
      department,
      year,
      gender,
      skills: parsedSkills,
      bio: bio ? bio.trim() : '',
      authProvider: 'local',
      isEmailVerified: true,
      role: 'student',
    });

    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(201).json({
      success: true,
      message: 'Account verified and created successfully! Welcome to TeamFinder.',
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        email: user.email,
        personalEmail: user.personalEmail,
        department: user.department,
        year: user.year,
        gender: user.gender,
        skills: user.skills,
        bio: user.bio,
        role: user.role,
        isFlagged: false,
      },
    });
  } catch (error) {
    console.error('Verify OTP and register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration verification failed',
    });
  }
};

// @desc    Send OTP for Forgot Password
// @route   POST /api/auth/forgot-password-otp
// @access  Public
const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your Roll Number or registered Email',
      });
    }

    const clean = identifier.trim().toLowerCase();
    const candidateRoll = identifier.trim().toUpperCase();
    const candidateEmail = clean.includes('@') ? clean : `${clean}@nbkrist.org`;

    const user = await User.findOne({
      $or: [
        { rollNumber: candidateRoll },
        { email: candidateEmail },
        { personalEmail: clean },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this roll number or email',
      });
    }

    const targetEmail = user.personalEmail || user.email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email: targetEmail, purpose: 'forgot_password' });

    await Otp.create({
      email: targetEmail,
      rollNumber: user.rollNumber,
      otp,
      purpose: 'forgot_password',
    });

    await sendForgotPasswordOtpEmail({
      toEmail: targetEmail,
      name: user.name,
      otp,
    });

    const [namePart, domainPart] = targetEmail.split('@');
    const maskedName = namePart.length > 2
      ? `${namePart.charAt(0)}***${namePart.charAt(namePart.length - 1)}`
      : `${namePart.charAt(0)}***`;
    const maskedEmail = `${maskedName}@${domainPart}`;

    res.json({
      success: true,
      message: `Password reset code sent to ${maskedEmail}. Valid for 5 minutes.`,
      maskedEmail,
      rollNumber: user.rollNumber,
    });
  } catch (error) {
    console.error('Forgot password OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send reset code',
    });
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password-otp
// @access  Public
const resetPasswordWithOtp = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Roll Number/Email, verification code, and your new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const clean = identifier.trim().toLowerCase();
    const candidateRoll = identifier.trim().toUpperCase();
    const candidateEmail = clean.includes('@') ? clean : `${clean}@nbkrist.org`;

    const user = await User.findOne({
      $or: [
        { rollNumber: candidateRoll },
        { email: candidateEmail },
        { personalEmail: clean },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered user found',
      });
    }

    const targetEmail = user.personalEmail || user.email;
    const cleanOtp = otp.toString().trim();

    const otpRecord = await Otp.findOne({
      email: targetEmail,
      otp: cleanOtp,
      purpose: 'forgot_password',
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code. Please request a new code.',
      });
    }

    user.password = newPassword;
    await user.save();

    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
};

// @desc    Link Google Account to active profile
// @route   POST /api/auth/link-google
// @access  Private
const linkGoogleAccount = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email.trim().toLowerCase();

    if (!email.endsWith('@nbkrist.org')) {
      return res.status(403).json({
        success: false,
        message: 'You can only link an official NBKRIST college account (@nbkrist.org)',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const rollFromEmail = email.split('@')[0].toUpperCase();
    if (user.rollNumber !== rollFromEmail && user.email !== email) {
      return res.status(400).json({
        success: false,
        message: `This Google account (${email}) does not match your registered roll number (${user.rollNumber}).`,
      });
    }

    const otherUser = await User.findOne({ googleId: payload.sub, _id: { $ne: user._id } });
    if (otherUser) {
      return res.status(400).json({
        success: false,
        message: 'This Google account is already linked to another student profile.',
      });
    }

    user.googleId = payload.sub;
    await user.save();

    res.json({
      success: true,
      message: 'Google account linked successfully!',
      user: {
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        email: user.email,
        googleId: user.googleId,
        department: user.department,
        year: user.year,
        gender: user.gender,
        skills: user.skills,
        bio: user.bio,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Link Google account error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to link Google account',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  googleAuth,
  googleJuniorAuth,
  sendRegistrationOtp,
  verifyOtpAndRegister,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
  linkGoogleAccount,
};

