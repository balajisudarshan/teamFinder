const rateLimit = require('express-rate-limit');

// Helper to skip rate limiting during automated testing
const isTestEnv = () => process.env.NODE_ENV === 'test';

// Rate limiter strictly for login and register routes
// Protects against automated brute-force attacks while providing generous headroom for normal usage and testing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Generous limit of 100 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Pass-through middleware for backward compatibility if referenced elsewhere
const noopLimiter = (req, res, next) => next();

module.exports = {
  authLimiter,
  apiLimiter: noopLimiter,
  createTeamLimiter: noopLimiter,
  joinRequestLimiter: noopLimiter,
};

