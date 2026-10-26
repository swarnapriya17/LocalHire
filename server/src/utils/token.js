import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Sign JWT token for user session
 */
export function signToken(user) {
  const payload = {
    userId: (user._id || user.id).toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
}

/**
 * Attach HTTP-only cookie to response
 */
export function setAuthCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: config.cookieMaxAgeMs,
    path: '/',
  });
}

/**
 * Clear authentication cookie on logout
 */
export function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    path: '/',
  });
}
