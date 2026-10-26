import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  submitApplication,
  getMyApplications,
  getJobApplications,
  getApplication,
  updateApplicationStatus,
} from '../controllers/application.controller.js';

const router = Router();

// All application routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/applications
 * @desc    Submit an application for an eligible published job
 * @access  Private (Job Seekers only)
 */
router.post('/', authorize('jobseeker'), submitApplication);

/**
 * @route   GET /api/applications/my
 * @desc    Retrieve authenticated job seeker's application history
 * @access  Private (Job Seekers & Admin)
 */
router.get('/my', authorize('jobseeker', 'admin'), getMyApplications);

/**
 * @route   GET /api/applications/job/:jobId
 * @desc    Retrieve applications for a specific job opening
 * @access  Private (Recruiter who owns the job & Admin)
 */
router.get('/job/:jobId', authorize('recruiter', 'admin'), getJobApplications);

/**
 * @route   GET /api/applications/:id
 * @desc    Retrieve a single application if authorized (applicant, job recruiter, or admin)
 * @access  Private (Applicant, Job Recruiter, Admin)
 */
router.get('/:id', authorize('jobseeker', 'recruiter', 'admin'), getApplication);

/**
 * @route   PATCH /api/applications/:id/status
 * @route   PUT /api/applications/:id/status
 * @desc    Update application status and interview details
 * @access  Private (Job Recruiter who owns the job & Admin)
 */
router.patch('/:id/status', authorize('recruiter', 'admin'), updateApplicationStatus);
router.put('/:id/status', authorize('recruiter', 'admin'), updateApplicationStatus);

export default router;
