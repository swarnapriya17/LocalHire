// In-memory failed login tracking
const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Middleware checking if the requesting IP is temporarily locked out
 */
export function checkLoginRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
  const record = loginAttempts.get(ip);

  if (record) {
    const timeSinceFirst = Date.now() - record.lastAttempt;
    
    // Reset if window expired
    if (timeSinceFirst > LOCKOUT_DURATION_MS) {
      loginAttempts.delete(ip);
    } else if (record.count >= MAX_ATTEMPTS) {
      const waitSeconds = Math.ceil((LOCKOUT_DURATION_MS - timeSinceFirst) / 1000);
      return res.status(429).json({
        success: false,
        error: {
          statusCode: 429,
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many failed login attempts. Please wait ${waitSeconds} seconds before trying again.`,
        },
      });
    }
  }

  next();
}

/**
 * Record a failed login attempt for the client IP
 */
export function recordFailedLogin(req) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
  record.count += 1;
  record.lastAttempt = Date.now();
  loginAttempts.set(ip, record);
}

/**
 * Reset failed attempts upon successful login
 */
export function resetLoginAttempts(req) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
  loginAttempts.delete(ip);
}
