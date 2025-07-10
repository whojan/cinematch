const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const { 
  authLimiter, 
  passwordResetLimiter, 
  emailVerificationLimiter,
  logRateLimit 
} = require('../middleware/rateLimiter');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Apply rate limit logging to all auth routes
router.use(logRateLimit);

// Validation middleware
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const passwordResetRequestValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

const passwordResetValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Helper function to extract device info
const getDeviceInfo = (req) => {
  return {
    userAgent: req.get('User-Agent') || '',
    ip: req.ip || req.connection.remoteAddress,
    platform: req.get('sec-ch-ua-platform') || 'unknown',
    mobile: req.get('sec-ch-ua-mobile') === '?1'
  };
};

// ===== AUTHENTICATION ENDPOINTS =====

// Register new user
router.post('/register', 
  authLimiter, 
  registerValidation, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName
      });

      // Send welcome email (don't wait for it)
      emailService.sendWelcomeEmail(email, firstName)
        .catch(error => console.error('Failed to send welcome email:', error));

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: result.user,
        tokens: result.tokens
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific errors
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  }
);

// Login user
router.post('/login', 
  authLimiter, 
  loginValidation, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const deviceInfo = getDeviceInfo(req);

      const result = await authService.login(email, password, deviceInfo);

      res.json({
        success: true,
        message: 'Login successful',
        user: result.user,
        tokens: result.tokens
      });

    } catch (error) {
      console.error('Login error:', error);

      // Handle specific errors
      if (error.message.includes('Invalid email or password')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      if (error.message.includes('locked')) {
        return res.status(423).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }
);

// Refresh access token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
});

// Logout user
router.post('/logout', optionalAuth, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    await authService.logout(refreshToken);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Logout from all devices
router.post('/logout-all', verifyToken, async (req, res) => {
  try {
    await authService.logoutAll(req.user.id);

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// ===== PASSWORD RESET =====

// Request password reset
router.post('/forgot-password', 
  passwordResetLimiter, 
  passwordResetRequestValidation, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { email } = req.body;
      
      await authService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link'
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link'
      });
    }
  }
);

// Reset password with token
router.post('/reset-password', 
  passwordResetLimiter, 
  passwordResetValidation, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      await authService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: 'Password reset successful'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.message.includes('Invalid or expired')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Password reset failed'
      });
    }
  }
);

// ===== EMAIL VERIFICATION =====

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const result = await authService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully',
      email: result.email
    });

  } catch (error) {
    console.error('Email verification error:', error);
    
    res.status(400).json({
      success: false,
      error: 'Invalid verification token'
    });
  }
});

// Resend verification email
router.post('/resend-verification', 
  emailVerificationLimiter, 
  body('email').isEmail().normalizeEmail(), 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { email } = req.body;
      
      await authService.resendVerificationEmail(email);

      res.json({
        success: true,
        message: 'Verification email sent'
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (error.message.includes('already verified')) {
        return res.status(400).json({
          success: false,
          error: 'Email is already verified'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }
  }
);

// ===== USER SESSION MANAGEMENT =====

// Get user sessions
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const sessions = await authService.getUserSessions(req.user.id);

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
});

// Revoke specific session
router.delete('/sessions/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await authService.revokeSession(req.user.id, sessionId);

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke session'
    });
  }
});

// ===== USER INFO =====

// Get current user info
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

// ===== UTILITY ENDPOINTS =====

// Check if email exists (for registration form)
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const { query } = require('../config/database');
    const result = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    
    res.json({
      success: true,
      exists: result.rows.length > 0
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check email'
    });
  }
});

// Test email configuration (admin only)
router.get('/test-email', verifyToken, async (req, res) => {
  try {
    // Simple admin check - you might want to implement proper role checking
    if (req.user.email !== 'admin@cinematch.com') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const result = await emailService.testEmailConfig();
    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;