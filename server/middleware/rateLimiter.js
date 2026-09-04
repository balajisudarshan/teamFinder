const rateLimit = require('express-rate-limit');

// Helper to skip rate limiting during automated testing
const isTestEnv = () => process.env.NODE_ENV === 'test';

// Global API rate limiter (protects against DDoS & bot scanning)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.',
  },
});

// Stricter rate limiter for authentication routes (prevents brute-force credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
});

// Rate limiter for team creation (prevents team spamming)
const createTeamLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    success: false,
    message: 'Too many teams created recently, please try again later.',
  },
});

// Rate limiter for join requests
const joinRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
  message: {
    success: false,
    message: 'Too many join requests submitted from this IP, please try again after 15 minutes.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  createTeamLimiter,
  joinRequestLimiter,
};
