import { applicationService } from '../services/application.service.js';
import {
  validateCreateApplication,
  validateUpdateStatus,
} from '../validators/application.validator.js';

/**
 * Handle application controller errors consistently
 */
function handleControllerError(err, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        statusCode: err.statusCode,
        code: err.code || 'APPLICATION_ERROR',
        message: err.message,
      },
    });
  }
  next(err);
}

/**
 * POST /api/applications
 * Submit an application for an existing published job (Job Seekers only)
 */
export async function submitApplication(req, res, next) {
  try {
    const validation = validateCreateApplication(req.body);
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

    const result = await applicationService.submitApplication(validation.data, req.user);

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Regional recruiter has been notified.',
      application: result.application,
      persistenceMode: result.persistenceMode,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/applications/my
 * Retrieve the authenticated job seeker's application history
 */
export async function getMyApplications(req, res, next) {
  try {
    const result = await applicationService.getMyApplications(req.user);

    return res.status(200).json({
      success: true,
      count: result.count,
      applications: result.applications,
      persistenceMode: result.persistenceMode,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/applications/job/:jobId
 * Retrieve applications for a specific job owned by the authenticated recruiter
 */
export async function getJobApplications(req, res, next) {
  try {
    const result = await applicationService.getJobApplications(req.params.jobId, req.user);

    return res.status(200).json({
      success: true,
      count: result.count,
      job: result.job,
      applications: result.applications,
      persistenceMode: result.persistenceMode,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/applications/:id
 * Retrieve a single application by ID if authorized (applicant, job recruiter, or admin)
 */
export async function getApplication(req, res, next) {
  try {
    const result = await applicationService.getApplicationById(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      application: result.application,
      isApplicant: result.isApplicant,
      isRecruiter: result.isRecruiter,
      persistenceMode: result.persistenceMode,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * PATCH /api/applications/:id/status
 * (Also supports PUT /api/applications/:id/status)
 * Update application status and interview details (Recruiter or Admin only)
 */
export async function updateApplicationStatus(req, res, next) {
  try {
    const validation = validateUpdateStatus(req.body);
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

    const result = await applicationService.updateApplicationStatus(
      req.params.id,
      validation.data,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: `Application status updated to "${validation.data.status}".`,
      application: result.application,
      persistenceMode: result.persistenceMode,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}
