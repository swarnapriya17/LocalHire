import { adminService } from '../services/admin.service.js';
import {
  validateUserStatusUpdate,
  validateEmployerVerification,
  validateJobModeration,
} from '../validators/admin.validator.js';

function handleControllerError(err, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        statusCode: err.statusCode,
        code: err.code || 'ADMIN_ERROR',
        message: err.message,
      },
    });
  }
  next(err);
}

/**
 * GET /api/admin/summary
 * (Also GET /api/admin/overview)
 * Platform-wide real DB aggregate metrics
 */
export async function getPlatformSummary(req, res, next) {
  try {
    const summary = await adminService.getPlatformSummary();
    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/admin/users
 * Paginated and searchable list of platform users
 */
export async function getUsers(req, res, next) {
  try {
    const { page, limit, role, accountStatus, search } = req.query;
    const result = await adminService.getUsers({
      page,
      limit,
      role,
      accountStatus,
      search,
    });
    return res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/admin/users/:id
 * Retrieve details for a specific user
 */
export async function getUserById(req, res, next) {
  try {
    const user = await adminService.getUserById(req.params.id);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * PUT /api/admin/users/:id/status
 * Suspend or reactivate user account
 */
export async function updateUserStatus(req, res, next) {
  try {
    const validation = validateUserStatusUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: validation.errors.join('; '),
          details: validation.errors,
        },
      });
    }

    const updatedUser = await adminService.updateUserStatus(
      req.params.id,
      validation.sanitized,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: `Account status updated to ${validation.sanitized.accountStatus}`,
      data: updatedUser,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/admin/employers/verification-queue
 * (Also GET /api/admin/verifications)
 * List employers awaiting verification review
 */
export async function getVerificationQueue(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await adminService.getVerificationQueue({
      page,
      limit,
      status,
    });
    return res.status(200).json({
      success: true,
      data: result.employers,
      pagination: result.pagination,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * PUT /api/admin/employers/:id/verification
 * (Also POST /api/admin/employers/:id/verify)
 * Approve or reject employer verification
 */
export async function reviewEmployerVerification(req, res, next) {
  try {
    const validation = validateEmployerVerification(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: validation.errors.join('; '),
          details: validation.errors,
        },
      });
    }

    const updatedEmployer = await adminService.reviewEmployerVerification(
      req.params.id,
      validation.sanitized,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: `Employer verification ${validation.sanitized.status} successfully`,
      data: updatedEmployer,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/admin/jobs
 * (Also GET /api/admin/jobs/moderation-queue)
 * Review job listings across the platform
 */
export async function getJobsForModeration(req, res, next) {
  try {
    const { page, limit, moderationStatus, status, search } = req.query;
    const result = await adminService.getJobsForModeration({
      page,
      limit,
      moderationStatus,
      status,
      search,
    });
    return res.status(200).json({
      success: true,
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * PUT /api/admin/jobs/:id/moderate
 * (Also POST /api/admin/jobs/:id/moderate)
 * Apply moderation decision to a job listing
 */
export async function moderateJob(req, res, next) {
  try {
    const validation = validateJobModeration(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: validation.errors.join('; '),
          details: validation.errors,
        },
      });
    }

    const moderatedJob = await adminService.moderateJob(
      req.params.id,
      validation.sanitized,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: `Job moderation action '${validation.sanitized.action}' applied successfully`,
      data: moderatedJob,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/admin/audit-logs
 * (Also GET /api/admin/activity)
 * Platform administrative activity logs
 */
export async function getAuditLogs(req, res, next) {
  try {
    const { page, limit, action, targetType } = req.query;
    const result = await adminService.getAuditLogs({
      page,
      limit,
      action,
      targetType,
    });
    return res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}
