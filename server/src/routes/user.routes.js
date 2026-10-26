import { Router } from 'express';
import { getProfile, updateProfile, getCandidatePublicProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Authenticated Job Seeker Profile Management
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Recruiter Candidate Review Route with Privacy Enforcement
router.get('/jobseeker/:id', authenticate, getCandidatePublicProfile);

export default router;
