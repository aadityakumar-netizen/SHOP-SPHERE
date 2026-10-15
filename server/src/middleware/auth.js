import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Protect routes - requires a valid Bearer JWT token
 */
export const requireAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing. Please log in.',
    });
  }

  try {
    const decoded = verifyToken(token);

    // Verify user still exists in database and is active
    const currentUser = await User.findById(decoded.id).select('-passwordHash');

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!currentUser.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This user account has been deactivated. Please contact support.',
      });
    }

    // Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

/**
 * Restrict routes to Administrator role only
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }
  next();
};

export default {
  requireAuth,
  requireAdmin,
};
