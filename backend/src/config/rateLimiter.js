// backend/src/config/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Global API rate limiter (soft), with exceptions for health and login
module.exports = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    try {
      const url = (req.originalUrl || req.url || '').toLowerCase();
      // Do not rate-limit health and login endpoints to avoid login loops
      if (url.startsWith('/health')) return true;
      if (url.startsWith('/api/auth/login')) return true;
      return false;
    } catch {
      return false;
    }
  },
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
    code: 'RATE_LIMITED',
  },
});

