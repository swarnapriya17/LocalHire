import User from '../models/user.model.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { recordFailedLogin, resetLoginAttempts } from '../middleware/rateLimiter.js';
import { isDbConnected } from '../config/db.js';

/**
 * POST /api/auth/register
 * Public registration for Job Seekers and Recruiters
 */
export async function register(req, res, next) {
  try {
    // 1. Validate payload
    const validation = validateRegister(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: validation.errors[0],
          details: validation.errors,
        },
      });
    }

    const { name, email, password, role } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check Database availability
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          statusCode: 503,
          code: 'DATABASE_UNAVAILABLE',
          message: 'Persistent account registration requires a MongoDB connection. MONGODB_URI is not configured in .env or the cluster is currently unreachable.',
        },
      });
    }

    // 3. Prevent duplicate accounts
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          statusCode: 409,
          code: 'DUPLICATE_ACCOUNT',
          message: 'An account with this email address already exists. Please sign in or use a different email.',
        },
      });
    }

    // 4. Create new persistent user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // Handled securely by virtual setter and pre-validate bcrypt hashing
      role,
      accountStatus: 'active',
    });

    // 5. Generate session token and set secure HTTP-only cookie
    const token = signToken(newUser);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: newUser.toJSON(),
      token, // Also provided in payload for clients requiring header-based auth
    });
  } catch (error) {
    // Handle MongoDB duplicate key error code 11000
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          statusCode: 409,
          code: 'DUPLICATE_ACCOUNT',
          message: 'An account with this email address already exists. Please sign in or use a different email.',
        },
      });
    }
    next(error);
  }
}

/**
 * POST /api/auth/login
 * User sign in with email and password
 */
export async function login(req, res, next) {
  try {
    // 1. Validate payload
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: validation.errors[0],
          details: validation.errors,
        },
      });
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check Database availability
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          statusCode: 503,
          code: 'DATABASE_UNAVAILABLE',
          message: 'Sign in requires a MongoDB connection. MONGODB_URI is not configured in .env or the cluster is currently unreachable.',
        },
      });
    }

    // 3. Find user by normalized email (explicitly selecting passwordHash)
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      recordFailedLogin(req);
      return res.status(401).json({
        success: false,
        error: {
          statusCode: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.',
        },
      });
    }

    // 4. Verify account is not suspended
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        error: {
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'This account has been suspended. Please contact support at support@localhire.in.',
        },
      });
    }

    // 5. Verify password hash using safe comparePassword method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      recordFailedLogin(req);
      return res.status(401).json({
        success: false,
        error: {
          statusCode: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.',
        },
      });
    }

    // 6. Reset login attempts on successful authentication
    resetLoginAttempts(req);

    // 7. Sign token and set HTTP-only cookie
    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Clear HTTP-only session cookie
 */
export function logout(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
}

/**
 * GET /api/auth/me
 * Restore current authenticated session
 */
export function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}
