// Middleware to block restricted actions for flagged users
const requireNotFlagged = (req, res, next) => {
  if (req.user && req.user.isFlagged) {
    const reason = req.user.flagReason || 'Account under review by coordinator';
    return res.status(403).json({
      success: false,
      isFlagged: true,
      message: `Your account has been flagged by the faculty coordinator: "${reason}". You cannot perform this action until your account is unflagged.`,
    });
  }
  next();
};

module.exports = {
  requireNotFlagged,
};
