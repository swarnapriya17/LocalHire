import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import jobRoutes from './job.routes.js';
import userRoutes from './user.routes.js';
import applicationRoutes from './application.routes.js';
import recruiterRoutes from './recruiter.routes.js';
import adminRoutes from './admin.routes.js';
import aiRoutes from './ai.routes.js';
import notificationRoutes from './notification.routes.js';

const apiRouter = Router();

// Mount routes
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/jobs', jobRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/applications', applicationRoutes);
apiRouter.use('/recruiter', recruiterRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/notifications', notificationRoutes);

export default apiRouter;
