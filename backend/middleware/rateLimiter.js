const rateLimit = require('express-rate-limit');

// Helper function to create standardized rate limit responses
const createRateLimitResponse = (req, res) => {
  res.status(429).json({
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    limit: req.rateLimit.limit,
    remaining: req.rateLimit.remaining,
    resetTime: new Date(req.rateLimit.resetTime).toISOString()
  });
};

// Skip rate limiting for successful responses in development
const skipSuccessfulRequests = (req, res) => {
  return process.env.NODE_ENV === 'development' && res.statusCode < 400;
};

// Standard rate limiter - General API usage
const standardLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: createRateLimitResponse,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  }
});

// Authentication rate limiter - More restrictive for auth endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 5, // 5 attempts per window
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Skip successful login attempts
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Use email if provided, otherwise IP
    return req.body?.email || req.ip;
  }
});

// Password reset rate limiter - Very restrictive
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.body?.email || req.ip;
  }
});

// Email verification rate limiter
const emailVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 verification emails per 10 minutes
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.body?.email || req.user?.email || req.ip;
  }
});

// Search rate limiter - For movie/user searches
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: skipSuccessfulRequests,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Recommendation rate limiter - For recommendation generation
const recommendationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 recommendation requests per 5 minutes
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: skipSuccessfulRequests,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Rating/Action rate limiter - For user actions like rating movies
const actionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 actions per minute (reasonable for quick rating sessions)
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: skipSuccessfulRequests,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Admin rate limiter - More generous for admin operations
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for admin
  message: createRateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: skipSuccessfulRequests,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// Create custom rate limiter with options
const createCustomLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: createRateLimitResponse,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => req.user?.id || req.ip
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Rate limit logging middleware
const logRateLimit = (req, res, next) => {
  if (req.rateLimit) {
    const logData = {
      ip: req.ip,
      userId: req.user?.id,
      endpoint: req.path,
      remaining: req.rateLimit.remaining,
      limit: req.rateLimit.limit,
      resetTime: new Date(req.rateLimit.resetTime).toISOString()
    };

    // Log warning when rate limit is close to being hit
    if (req.rateLimit.remaining <= Math.floor(req.rateLimit.limit * 0.1)) {
      console.warn('Rate limit warning:', logData);
    }

    // Log when rate limit is exceeded
    if (req.rateLimit.remaining === 0) {
      console.warn('Rate limit exceeded:', logData);
    }
  }
  next();
};

module.exports = {
  standardLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  searchLimiter,
  recommendationLimiter,
  actionLimiter,
  adminLimiter,
  createCustomLimiter,
  logRateLimit
};