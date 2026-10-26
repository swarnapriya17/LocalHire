import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getDashboardSummary,
  getCompanyProfile,
  updateCompanyProfile,
  getRecruiterAnalytics,
  getScheduledInterviews,
} from '../controllers/recruiter.controller.js';

const router = Router();

// All recruiter routes require authentication and recruiter/admin authorization
router.use(authenticate);
router.use(authorize('recruiter', 'admin'));

/**
 * @route   GET /api/recruiter/summary
 * @route   GET /api/recruiter/dashboard
 * @desc    Retrieve recruiter dashboard overview metrics and company status
 * @access  Private (Recruiters & Admins)
 */
router.get('/summary', getDashboardSummary);
router.get('/dashboard', getDashboardSummary);

/**
 * @route   GET /api/recruiter/profile
 * @desc    Retrieve company profile information
 * @access  Private (Recruiters & Admins)
 */
router.get('/profile', getCompanyProfile);

/**
 * @route   PUT /api/recruiter/profile
 * @desc    Update company profile and permitted employer details
 * @access  Private (Recruiters & Admins)
 */
router.put('/profile', updateCompanyProfile);

/**
 * @route   GET /api/recruiter/analytics
 * @desc    Retrieve detailed analytics, per-job breakdown, and conversion rates
 * @access  Private (Recruiters & Admins)
 */
router.get('/analytics', getRecruiterAnalytics);

/**
 * @route   GET /api/recruiter/interviews
 * @desc    Retrieve all scheduled interviews across the recruiter's openings
 * @access  Private (Recruiters & Admins)
 */
router.get('/interviews', getScheduledInterviews);

export default router;
