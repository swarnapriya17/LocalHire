import { jobService } from '../services/job.service.js';
import { validateCreateJob, validateUpdateJob } from '../validators/job.validator.js';

/**
 * GET /api/jobs
 * List published jobs with search, filtering, and pagination
 */
export async function listJobs(req, res, next) {
  try {
    const filters = {
      keyword: req.query.keyword || '',
      town: req.query.town || req.query.location || 'all',
      category: req.query.category || 'all',
      experience: req.query.experience || 'all',
      isFresher: req.query.isFresher,
      employmentType: req.query.employmentType || 'all',
      workMode: req.query.workMode || 'all',
      salaryMin: req.query.salaryMin,
      status: req.query.status || 'published',
      page: req.query.page || '1',
      limit: req.query.limit || '12',
    };

    const result = await jobService.getJobs(filters);

    return res.status(200).json({
      success: true,
      count: result.jobs.length,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      persistenceMode: result.persistenceMode,
      data: result.jobs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/jobs/:id
 * Retrieve a single job opening
 */
export async function getJob(req, res, next) {
  try {
    const result = await jobService.getJobById(req.params.id);

    if (!result || !result.job) {
      return res.status(404).json({
        success: false,
        error: {
          statusCode: 404,
          code: 'JOB_NOT_FOUND',
          message: 'Job vacancy not found. It may have expired or been removed.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      job: result.job,
      persistenceMode: result.persistenceMode,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/jobs
 * Create a new job vacancy (Recruiter or Admin)
 */
export async function createJob(req, res, next) {
  try {
    const validation = validateCreateJob(req.body);
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

    const result = await jobService.createJob(validation.data, req.user);

    return res.status(201).json({
      success: true,
      message: 'Job vacancy published successfully.',
      job: result.job,
      persistenceMode: result.persistenceMode,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/jobs/:id
 * Update an existing job vacancy (Owner Recruiter or Admin)
 */
export async function updateJob(req, res, next) {
  try {
    const validation = validateUpdateJob(req.body);
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

    const result = await jobService.updateJob(req.params.id, validation.data, req.user);

    return res.status(200).json({
      success: true,
      message: 'Job vacancy updated successfully.',
      job: result.job,
      persistenceMode: result.persistenceMode,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          statusCode: error.statusCode,
          code: error.code || 'ERROR',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

/**
 * DELETE /api/jobs/:id
 * Remove or close a job vacancy (Owner Recruiter or Admin)
 */
export async function deleteJob(req, res, next) {
  try {
    await jobService.deleteJob(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      message: 'Job opening removed successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          statusCode: error.statusCode,
          code: error.code || 'ERROR',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

/**
 * GET /api/jobs/recruiter/my-jobs
 * Retrieve all jobs posted by the currently authenticated recruiter
 */
export async function getRecruiterJobs(req, res, next) {
  try {
    const recruiterId = req.user._id || req.user.id;
    const result = await jobService.getJobs({
      recruiterId,
      status: 'all',
      limit: 100,
    });

    return res.status(200).json({
      success: true,
      count: result.jobs.length,
      jobs: result.jobs,
      persistenceMode: result.persistenceMode,
    });
  } catch (error) {
    next(error);
  }
}
