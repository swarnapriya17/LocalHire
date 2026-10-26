import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkLoginRateLimit } from '../middleware/rateLimiter.js';

const router = Router();

// Public Authentication Routes
router.post('/register', register);
router.post('/login', checkLoginRateLimit, login);
router.post('/logout', logout);

// Session Verification Route
router.get('/me', authenticate, getCurrentUser);

// Role-Protected Verification Endpoints (Useful for tests and authorization verification)
router.get('/test/jobseeker', authenticate, authorize('jobseeker', 'admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome to Job Seeker protected resources', user: req.user });
});

router.get('/test/recruiter', authenticate, authorize('recruiter', 'admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome to Recruiter protected resources', user: req.user });
});

router.get('/test/admin', authenticate, authorize('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome to Administrator protected resources', user: req.user });
});

export default router;
