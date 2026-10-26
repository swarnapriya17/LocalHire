import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAIStatus,
  careerChat,
  reviewProfile,
  skillGapAnalysis,
  generateInterviewQuestions,
  provideInterviewFeedback,
} from '../controllers/ai.controller.js';

const router = Router();

// Strictly protect all AI endpoints with authentication and Job Seeker / Admin authorization
router.use(authenticate);
router.use(authorize('jobseeker', 'admin'));

/**
 * @route   GET /api/ai/status
 * @desc    Check whether LLM integration is configured and active
 * @access  Private (Job Seeker, Admin)
 */
router.get('/status', getAIStatus);

/**
 * @route   POST /api/ai/chat
 * @desc    Interactive AI Career Guidance Chat
 * @access  Private (Job Seeker, Admin)
 */
router.post('/chat', careerChat);

/**
 * @route   POST /api/ai/profile-review
 * @desc    AI Resume and Profile Review Suggestions
 * @access  Private (Job Seeker, Admin)
 */
router.post('/profile-review', reviewProfile);

/**
 * @route   POST /api/ai/skill-gap
 * @desc    AI Skill-Gap & Career Learning Path Analysis
 * @access  Private (Job Seeker, Admin)
 */
router.post('/skill-gap', skillGapAnalysis);

/**
 * @route   POST /api/ai/interview/questions
 * @desc    Generate role-specific interview practice questions
 * @access  Private (Job Seeker, Admin)
 */
router.post('/interview/questions', generateInterviewQuestions);

/**
 * @route   POST /api/ai/interview/feedback
 * @desc    Evaluate candidate interview answers using STAR method
 * @access  Private (Job Seeker, Admin)
 */
router.post('/interview/feedback', provideInterviewFeedback);

export default router;
