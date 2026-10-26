import { Router } from 'express';
import {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getRecruiterJobs,
} from '../controllers/job.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public Routes
router.get('/', listJobs);
router.get('/recruiter/my-jobs', authenticate, authorize('recruiter', 'admin'), getRecruiterJobs);
router.get('/:id', getJob);

// Protected Recruiter / Admin Routes
router.post('/', authenticate, authorize('recruiter', 'admin'), createJob);
router.put('/:id', authenticate, authorize('recruiter', 'admin'), updateJob);
router.delete('/:id', authenticate, authorize('recruiter', 'admin'), deleteJob);

export default router;
