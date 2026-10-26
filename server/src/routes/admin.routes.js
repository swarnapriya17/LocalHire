import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getPlatformSummary,
  getUsers,
  getUserById,
  updateUserStatus,
  getVerificationQueue,
  reviewEmployerVerification,
  getJobsForModeration,
  moderateJob,
  getAuditLogs,
} from '../controllers/admin.controller.js';

const router = Router();

// Strictly enforce authentication and administrative role on all admin routes
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/summary
 * @route   GET /api/admin/overview
 * @desc    Platform overview and database-backed aggregate metrics
 * @access  Private (Admin Only)
 */
router.get('/summary', getPlatformSummary);
router.get('/overview', getPlatformSummary);

/**
 * @route   GET /api/admin/users
 * @desc    Paginated list of platform users with role/status filters and search
 * @access  Private (Admin Only)
 */
router.get('/users', getUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    View details of a specific user
 * @access  Private (Admin Only)
 */
router.get('/users/:id', getUserById);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Suspend or reactivate a user account
 * @access  Private (Admin Only)
 */
router.put('/users/:id/status', updateUserStatus);

/**
 * @route   GET /api/admin/employers/verification-queue
 * @route   GET /api/admin/verifications
 * @desc    List employers awaiting verification or filtered by status
 * @access  Private (Admin Only)
 */
router.get('/employers/verification-queue', getVerificationQueue);
router.get('/verifications', getVerificationQueue);

/**
 * @route   PUT /api/admin/employers/:id/verification
 * @route   POST /api/admin/employers/:id/verify
 * @desc    Approve or reject employer verification request
 * @access  Private (Admin Only)
 */
router.put('/employers/:id/verification', reviewEmployerVerification);
router.post('/employers/:id/verify', reviewEmployerVerification);

/**
 * @route   GET /api/admin/jobs
 * @route   GET /api/admin/jobs/moderation-queue
 * @desc    List jobs for administrative moderation with filters
 * @access  Private (Admin Only)
 */
router.get('/jobs', getJobsForModeration);
router.get('/jobs/moderation-queue', getJobsForModeration);

/**
 * @route   PUT /api/admin/jobs/:id/moderate
 * @route   POST /api/admin/jobs/:id/moderate
 * @desc    Approve, reject, flag, or unpublish a job listing
 * @access  Private (Admin Only)
 */
router.put('/jobs/:id/moderate', moderateJob);
router.post('/jobs/:id/moderate', moderateJob);

/**
 * @route   GET /api/admin/audit-logs
 * @route   GET /api/admin/activity
 * @desc    Retrieve platform administrative activity and audit logs
 * @access  Private (Admin Only)
 */
router.get('/audit-logs', getAuditLogs);
router.get('/activity', getAuditLogs);

export default router;
