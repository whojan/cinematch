const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
// Temporarily disabled Stack Auth due to module issues
// const { StackServerApp } = require('@stackframe/stack');

// Initialize Stack Auth (temporarily disabled)
// const stack = new StackServerApp({
//   tokenStore: 'nextjs-cookie',
//   projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
//   clientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
//   serverKey: process.env.STACK_SECRET_SERVER_KEY,
// });

// JWT Token verification middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const userResult = await query(
      'SELECT id, email, is_verified, locked_until FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Check if user is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({
        success: false,
        error: 'Account temporarily locked. Please try again later.'
      });
    }

    // Check if email is verified (optional, can be disabled for development)
    if (process.env.NODE_ENV === 'production' && !user.is_verified) {
      return res.status(403).json({
        success: false,
        error: 'Email verification required'
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    req.user = {
      id: user.id,
      email: user.email,
      isVerified: user.is_verified
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Stack Auth middleware (temporarily disabled)
/*
const verifyStackAuth = async (req, res, next) => {
  try {
    const user = await stack.getUser({ headers: req.headers });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user exists in our database
    const userResult = await query(
      'SELECT id, email, is_verified FROM users WHERE email = $1',
      [user.primaryEmail]
    );

    let dbUser;
    if (userResult.rows.length === 0) {
      // Create user in our database if doesn't exist
      const insertResult = await query(
        `INSERT INTO users (email, password_hash, is_verified, created_at) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
         RETURNING id, email, is_verified`,
        [user.primaryEmail, 'stack_auth_user', true]
      );
      dbUser = insertResult.rows[0];
      
      // Create user profile
      await query(
        `INSERT INTO user_profiles (user_id, preferences, settings) 
         VALUES ($1, $2, $3)`,
        [dbUser.id, '{}', '{}']
      );
    } else {
      dbUser = userResult.rows[0];
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      isVerified: dbUser.is_verified,
      stackUser: user
    };

    next();
  } catch (error) {
    console.error('Stack Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};
*/

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userResult = await query(
      'SELECT id, email, is_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // Don't fail, just set user to null
    req.user = null;
    next();
  }
};

// Admin only middleware
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Check if user has admin role
  const adminResult = await query(
    'SELECT id FROM user_profiles WHERE user_id = $1 AND settings->>\'role\' = \'admin\'',
    [req.user.id]
  );

  if (adminResult.rows.length === 0) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

module.exports = {
  verifyToken,
  // verifyStackAuth, // temporarily disabled
  optionalAuth,
  requireAdmin,
  // stack // temporarily disabled
};