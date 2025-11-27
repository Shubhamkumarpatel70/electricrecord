const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Access denied. No authorization token provided.', code: 'NO_TOKEN' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. Invalid token format.', code: 'INVALID_TOKEN_FORMAT' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password -loginAttempts -lockUntil');

    if (!user) return res.status(401).json({ success: false, message: 'Access denied. User not found.', code: 'USER_NOT_FOUND' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Access denied. Account is deactivated.', code: 'ACCOUNT_DEACTIVATED' });
    if (user.isLocked) return res.status(423).json({ success: false, message: 'Access denied. Account is temporarily locked due to multiple failed login attempts.', code: 'ACCOUNT_LOCKED', lockUntil: user.lockUntil });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Access denied. Invalid token.', code: 'INVALID_TOKEN' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Access denied. Token has expired.', code: 'TOKEN_EXPIRED' });
    res.status(500).json({ success: false, message: 'Internal server error during authentication.', code: 'AUTH_ERROR' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.', code: 'ADMIN_ACCESS_DENIED' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error during admin authentication.', code: 'ADMIN_AUTH_ERROR' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password -loginAttempts -lockUntil');
    if (user && user.isActive && !user.isLocked) req.user = user;
    next();
  } catch (error) {
    next();
  }
};

const authRateLimit = (req, res, next) => {
  const clientIP = req.ip;
  const endpoint = req.originalUrl;
  if (!req.app.locals.authAttempts) req.app.locals.authAttempts = new Map();
  const key = `${clientIP}:${endpoint}`;
  const attempts = req.app.locals.authAttempts.get(key) || { count: 0, resetTime: Date.now() + 15 * 60 * 1000 };
  if (Date.now() > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = Date.now() + 15 * 60 * 1000;
  }
  if (attempts.count >= 5) {
    return res.status(429).json({ success: false, message: 'Too many authentication attempts. Please try again later.', code: 'RATE_LIMIT_EXCEEDED', retryAfter: Math.ceil((attempts.resetTime - Date.now()) / 1000) });
  }
  attempts.count++;
  req.app.locals.authAttempts.set(key, attempts);
  next();
};

module.exports = { auth, adminAuth, optionalAuth, authRateLimit };


