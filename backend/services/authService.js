const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../config/database');
const emailService = require('./emailService');

class AuthService {
  // Generate JWT tokens
  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '15m', // Short-lived access token
      issuer: 'cinematch-api',
      subject: user.id
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d', // Long-lived refresh token
      issuer: 'cinematch-api',
      subject: user.id
    });

    return { accessToken, refreshToken };
  }

  // Register new user
  async register(userData) {
    const { email, password, firstName, lastName } = userData;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, verification_token, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
         RETURNING id, email, first_name, last_name, is_verified, created_at`,
        [email.toLowerCase(), passwordHash, firstName, lastName, verificationToken]
      );

      const user = userResult.rows[0];

      // Create user profile
      await client.query(
        `INSERT INTO user_profiles (user_id, preferences, settings, created_at) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [user.id, JSON.stringify({}), JSON.stringify({ theme: 'dark', language: 'en' })]
      );

      await client.query('COMMIT');

      // Send verification email (don't wait for it)
      if (process.env.NODE_ENV === 'production') {
        emailService.sendVerificationEmail(user.email, verificationToken)
          .catch(error => console.error('Failed to send verification email:', error));
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.is_verified,
          createdAt: user.created_at
        },
        tokens
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Login user
  async login(email, password, deviceInfo = {}) {
    const client = await getClient();
    try {
      // Get user with login attempt tracking
      const userResult = await client.query(
        `SELECT id, email, password_hash, first_name, last_name, is_verified, 
                login_attempts, locked_until, last_login
         FROM users WHERE email = $1`,
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = userResult.rows[0];

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const unlockTime = new Date(user.locked_until).toLocaleString();
        throw new Error(`Account is temporarily locked until ${unlockTime}`);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        // Increment login attempts
        const newAttempts = (user.login_attempts || 0) + 1;
        const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // Lock for 30 minutes after 5 attempts

        await client.query(
          'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
          [newAttempts, lockUntil, user.id]
        );

        if (lockUntil) {
          throw new Error('Too many failed login attempts. Account locked for 30 minutes.');
        }

        throw new Error('Invalid email or password');
      }

      // Reset login attempts on successful login
      await client.query(
        'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store refresh token with device info
      await this.storeRefreshToken(user.id, tokens.refreshToken, deviceInfo);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.is_verified,
          lastLogin: user.last_login
        },
        tokens
      };

    } finally {
      client.release();
    }
  }

  // Store refresh token
  async storeRefreshToken(userId, refreshToken, deviceInfo = {}) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO user_sessions (user_id, refresh_token, expires_at, device_info, created_at, last_used) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, refreshToken, expiresAt, JSON.stringify(deviceInfo)]
    );

    // Clean up old expired sessions
    await query(
      'DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP'
    );
  }

  // Refresh access token
  async refreshToken(refreshTokenString) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshTokenString, process.env.JWT_REFRESH_SECRET);

      // Check if refresh token exists in database
      const sessionResult = await query(
        `SELECT us.user_id, us.expires_at, u.email, u.first_name, u.last_name, u.is_verified
         FROM user_sessions us
         JOIN users u ON us.user_id = u.id
         WHERE us.refresh_token = $1 AND us.is_active = true`,
        [refreshTokenString]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      const session = sessionResult.rows[0];

      // Check if token is expired
      if (new Date(session.expires_at) <= new Date()) {
        // Clean up expired token
        await query('DELETE FROM user_sessions WHERE refresh_token = $1', [refreshTokenString]);
        throw new Error('Refresh token expired');
      }

      // Update last used timestamp
      await query(
        'UPDATE user_sessions SET last_used = CURRENT_TIMESTAMP WHERE refresh_token = $1',
        [refreshTokenString]
      );

      // Generate new access token
      const user = {
        id: session.user_id,
        email: session.email,
        first_name: session.first_name,
        last_name: session.last_name,
        is_verified: session.is_verified
      };

      const tokens = this.generateTokens(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.is_verified
        },
        accessToken: tokens.accessToken
      };

    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Logout user
  async logout(refreshToken) {
    if (refreshToken) {
      await query(
        'UPDATE user_sessions SET is_active = false WHERE refresh_token = $1',
        [refreshToken]
      );
    }
    return { success: true };
  }

  // Logout from all devices
  async logoutAll(userId) {
    await query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
      [userId]
    );
    return { success: true };
  }

  // Request password reset
  async requestPasswordReset(email) {
    const userResult = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists - return success anyway
      return { success: true };
    }

    const user = userResult.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetTokenExpires, user.id]
    );

    // Send password reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    return { success: true };
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    const userResult = await query(
      'SELECT id, email FROM users WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP',
      [token]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const user = userResult.rows[0];
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    // Invalidate all existing sessions
    await query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
      [user.id]
    );

    return { success: true };
  }

  // Verify email
  async verifyEmail(token) {
    const userResult = await query(
      'SELECT id, email FROM users WHERE verification_token = $1',
      [token]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid verification token');
    }

    const user = userResult.rows[0];

    await query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
      [user.id]
    );

    return { success: true, email: user.email };
  }

  // Resend verification email
  async resendVerificationEmail(email) {
    const userResult = await query(
      'SELECT id, email, is_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      throw new Error('Email is already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    await query(
      'UPDATE users SET verification_token = $1 WHERE id = $2',
      [verificationToken, user.id]
    );

    await emailService.sendVerificationEmail(user.email, verificationToken);

    return { success: true };
  }

  // Get user sessions
  async getUserSessions(userId) {
    const sessionsResult = await query(
      `SELECT id, device_info, ip_address, created_at, last_used, is_active
       FROM user_sessions 
       WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
       ORDER BY last_used DESC`,
      [userId]
    );

    return sessionsResult.rows;
  }

  // Revoke specific session
  async revokeSession(userId, sessionId) {
    await query(
      'UPDATE user_sessions SET is_active = false WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    return { success: true };
  }
}

module.exports = new AuthService();