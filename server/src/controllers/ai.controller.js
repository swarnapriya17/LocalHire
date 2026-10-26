import { aiService } from '../services/ai.service.js';
import {
  validateCareerChat,
  validateProfileReview,
  validateSkillGap,
  validateInterviewQuestions,
  validateInterviewFeedback,
} from '../validators/ai.validator.js';

function handleControllerError(err, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        statusCode: err.statusCode,
        code: err.code || 'AI_ERROR',
        message: err.message,
      },
    });
  }
  if (err.name === 'TimeoutError' || err.code === 'ABORT_ERR') {
    return res.status(504).json({
      success: false,
      error: {
        statusCode: 504,
        code: 'LLM_TIMEOUT',
        message: 'AI provider request timed out. Please try again.',
      },
    });
  }
  next(err);
}

/**
 * GET /api/ai/status
 * Check if LLM integration is configured and active
 */
export async function getAIStatus(req, res, next) {
  try {
    const status = aiService.getStatus();
    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * POST /api/ai/chat
 * Interactive Career Guidance Chat
 */
export async function careerChat(req, res, next) {
  try {
    const validation = validateCareerChat(req.body);
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

    const userId = req.user._id || req.user.id;
    const result = await aiService.chat({
      message: validation.sanitized.message,
      history: validation.sanitized.history,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * POST /api/ai/profile-review
 * Resume & Profile Improvement Analysis
 */
export async function reviewProfile(req, res, next) {
  try {
    const validation = validateProfileReview(req.body);
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

    const userId = req.user._id || req.user.id;
    const result = await aiService.reviewProfile({
      customProfile: validation.sanitized.customProfile,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * POST /api/ai/skill-gap
 * Skill-Gap & Career Learning Path Analysis
 */
export async function skillGapAnalysis(req, res, next) {
  try {
    const validation = validateSkillGap(req.body);
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

    const userId = req.user._id || req.user.id;
    const result = await aiService.analyzeSkillGap({
      targetRole: validation.sanitized.targetRole,
      currentSkills: validation.sanitized.currentSkills,
      jobDescription: validation.sanitized.jobDescription,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * POST /api/ai/interview/questions
 * Generate targeted role-specific interview practice questions
 */
export async function generateInterviewQuestions(req, res, next) {
  try {
    const validation = validateInterviewQuestions(req.body);
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

    const userId = req.user._id || req.user.id;
    const result = await aiService.generateInterviewQuestions({
      role: validation.sanitized.role,
      experienceLevel: validation.sanitized.experienceLevel,
      category: validation.sanitized.category,
      jobDescription: validation.sanitized.jobDescription,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * POST /api/ai/interview/feedback
 * Provide constructive critique on practice answers
 */
export async function provideInterviewFeedback(req, res, next) {
  try {
    const validation = validateInterviewFeedback(req.body);
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

    const userId = req.user._id || req.user.id;
    const result = await aiService.provideInterviewFeedback({
      question: validation.sanitized.question,
      answer: validation.sanitized.answer,
      role: validation.sanitized.role,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}
