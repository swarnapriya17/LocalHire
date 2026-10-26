import { config } from '../config/env.js';
import { verifyToken } from '../utils/token.js';
import { isDbConnected } from '../config/db.js';
import User from '../models/user.model.js';

/**
 * Authentication Middleware
 * Checks HTTP-only cookie or Authorization Bearer header
 */
export async function authenticate(req, res, next) {
  let token = null;

  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies[config.cookieName]) {
    token = req.cookies[config.cookieName];
  } 
  // 2. Fallback to Authorization: Bearer <token>
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        code: 'UNAUTHENTICATED',
        message: 'Authentication required. Please sign in to access this resource.',
      },
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        code: 'INVALID_TOKEN',
        message: 'Your session has expired or is invalid. Please sign in again.',
      },
    });
  }

  // If database is connected, verify user still exists in DB and is active
  if (isDbConnected()) {
    try {
      const user = await User.findById(decoded.userId).select('-passwordHash');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            statusCode: 401,
            code: 'USER_NOT_FOUND',
            message: 'User account associated with this session no longer exists.',
          },
        });
      }

      if (user.accountStatus === 'suspended') {
        return res.status(403).json({
          success: false,
          error: {
            statusCode: 403,
            code: 'ACCOUNT_SUSPENDED',
            message: 'This account has been suspended. Please contact support.',
          },
        });
      }

      req.user = user.toJSON();
    } catch (err) {
      // If DB read throws, fallback to verified token payload safely
      req.user = {
        _id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }
  } else {
    req.user = {
      _id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  }

  next();
}

/**
 * Role-Based Authorization Middleware
 * Restricts access to specific user roles (e.g. 'jobseeker', 'recruiter', 'admin')
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          statusCode: 401,
          code: 'UNAUTHENTICATED',
          message: 'Authentication required before checking permissions.',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          statusCode: 403,
          code: 'FORBIDDEN_ROLE',
          message: `Access denied. Authorized roles: [${allowedRoles.join(', ')}]. Your current role is "${req.user.role}".`,
        },
      });
    }

    next();
  };
}
