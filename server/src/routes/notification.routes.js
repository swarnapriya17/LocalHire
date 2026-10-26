import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller.js';

const router = Router();

// All notification routes strictly require authentication
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Retrieve paginated notifications for current user
 * @access  Private (All authenticated roles)
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Retrieve count of unread notifications
 * @access  Private (All authenticated roles)
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PATCH /api/notifications/:id/read
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a specific notification as read
 * @access  Private (Recipient only)
 */
router.patch('/:id/read', markAsRead);
router.put('/:id/read', markAsRead);

/**
 * @route   PATCH /api/notifications/read-all
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for current user
 * @access  Private (Recipient only)
 */
router.patch('/read-all', markAllAsRead);
router.put('/read-all', markAllAsRead);

export default router;
