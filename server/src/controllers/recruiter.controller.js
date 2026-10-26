import { recruiterService } from '../services/recruiter.service.js';
import { validateRecruiterProfileUpdate } from '../validators/recruiter.validator.js';

function handleControllerError(err, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        statusCode: err.statusCode,
        code: err.code || 'RECRUITER_ERROR',
        message: err.message,
      },
    });
  }
  next(err);
}

/**
 * GET /api/recruiter/summary
 * (Also supports GET /api/recruiter/dashboard)
 * Retrieve overview metrics, applicant pipeline count, and company status
 */
export async function getDashboardSummary(req, res, next) {
  try {
    const result = await recruiterService.getDashboardSummary(req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/recruiter/profile
 * Retrieve company profile and employer information
 */
export async function getCompanyProfile(req, res, next) {
  try {
    const result = await recruiterService.getCompanyProfile(req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * PUT /api/recruiter/profile
 * Update company profile and permitted employer details
 */
export async function updateCompanyProfile(req, res, next) {
  try {
    const validation = validateRecruiterProfileUpdate(req.body);
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

    const result = await recruiterService.updateCompanyProfile(validation.data, req.user);

    return res.status(200).json({
      success: true,
      message: 'Company profile updated successfully.',
      data: result,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/recruiter/analytics
 * Retrieve detailed recruitment analytics and pipeline conversion rates
 */
export async function getRecruiterAnalytics(req, res, next) {
  try {
    const result = await recruiterService.getRecruiterAnalytics(req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/recruiter/interviews
 * Retrieve all interviews scheduled for the recruiter's job openings
 */
export async function getScheduledInterviews(req, res, next) {
  try {
    const result = await recruiterService.getScheduledInterviews(req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}
