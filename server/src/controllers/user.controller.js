import User from '../models/user.model.js';
import { isDbConnected } from '../config/db.js';
import { validateProfileUpdate } from '../validators/profile.validator.js';
import { calculateProfileCompleteness } from '../utils/completeness.js';

/**
 * GET /api/users/profile
 * Retrieve authenticated user's profile with completeness calculation
 */
export async function getProfile(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          statusCode: 503,
          code: 'DATABASE_UNAVAILABLE',
          message: 'Persistent profile retrieval requires an active MongoDB connection. MONGODB_URI is not configured in .env or the cluster is currently unreachable.',
        },
      });
    }

    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          statusCode: 404,
          code: 'USER_NOT_FOUND',
          message: 'User profile not found in database.',
        },
      });
    }

    const completeness = calculateProfileCompleteness(user);

    return res.status(200).json({
      success: true,
      profile: user.toJSON(),
      profileCompleteness: completeness,
      persistenceMode: 'mongodb',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/profile
 * Validate and update authenticated user's profile with ownership enforcement
 */
export async function updateProfile(req, res, next) {
  try {
    // 1. Validate payload allowlist & formatting first
    const validation = validateProfileUpdate(req.body);
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

    // 2. Enforce database requirement (no insecure in-memory shared fallback for private profile data)
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          statusCode: 503,
          code: 'DATABASE_UNAVAILABLE',
          message: 'Persistent profile updates require an active MongoDB connection. MONGODB_URI is not configured in .env or the cluster is currently unreachable.',
        },
      });
    }

    // 3. Strict ownership enforcement: updates apply only to req.user._id
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          statusCode: 404,
          code: 'USER_NOT_FOUND',
          message: 'User account not found.',
        },
      });
    }

    // 4. Merge authorized fields safely
    if (validation.data.name) {
      user.name = validation.data.name;
    }

    if (validation.data.jobseekerProfile) {
      const existing = user.jobseekerProfile ? user.jobseekerProfile.toObject() : {};
      user.jobseekerProfile = {
        ...existing,
        ...validation.data.jobseekerProfile,
      };
    }

    await user.save();

    const completeness = calculateProfileCompleteness(user);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      profile: user.toJSON(),
      profileCompleteness: completeness,
      persistenceMode: 'mongodb',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/jobseeker/:id
 * Candidate public profile view for recruiters with privacy settings enforcement
 */
export async function getCandidatePublicProfile(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          statusCode: 503,
          code: 'DATABASE_UNAVAILABLE',
          message: 'Viewing candidate profiles requires an active MongoDB connection.',
        },
      });
    }

    const candidateId = req.params.id;
    const user = await User.findById(candidateId).select('-passwordHash');

    if (!user || user.role !== 'jobseeker') {
      return res.status(404).json({
        success: false,
        error: {
          statusCode: 404,
          code: 'CANDIDATE_NOT_FOUND',
          message: 'Candidate profile not found.',
        },
      });
    }

    // Privacy setting enforcement:
    const isVisible = user.jobseekerProfile?.privacySettings?.visibleToRecruiters !== false;
    const isSelf = req.user && String(req.user._id || req.user.id) === String(user._id);
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isVisible && !isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          statusCode: 403,
          code: 'PROFILE_PRIVATE',
          message: 'This candidate has set their profile to private. Recruiter discovery is currently disabled by the user.',
        },
      });
    }

    const completeness = calculateProfileCompleteness(user);

    return res.status(200).json({
      success: true,
      profile: user.toJSON(),
      profileCompleteness: completeness,
    });
  } catch (error) {
    next(error);
  }
}
