import { notificationService } from '../services/notification.service.js';
import {
  validateNotificationQuery,
  validateNotificationId,
} from '../validators/notification.validator.js';

function handleControllerError(err, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        statusCode: err.statusCode,
        code: err.code || 'NOTIFICATION_ERROR',
        message: err.message,
      },
    });
  }
  next(err);
}

/**
 * GET /api/notifications
 * Retrieve paginated notifications for the authenticated user
 */
export async function getNotifications(req, res, next) {
  try {
    const { sanitized } = validateNotificationQuery(req.query);
    const userId = req.user._id || req.user.id;

    const result = await notificationService.getNotifications({
      userId,
      page: sanitized.page,
      limit: sanitized.limit,
      isRead: sanitized.isRead,
    });

    return res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * GET /api/notifications/unread-count
 * Retrieve unread notification count
 */
export async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user._id || req.user.id;
    const result = await notificationService.getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      unreadCount: result.unreadCount,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * (Also supports PUT /api/notifications/:id/read)
 * Mark a single notification as read
 */
export async function markAsRead(req, res, next) {
  try {
    const validation = validateNotificationId(req.params.id);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: validation.error,
        },
      });
    }

    const userId = req.user._id || req.user.id;
    const updated = await notificationService.markAsRead({
      notificationId: validation.sanitizedId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}

/**
 * PATCH /api/notifications/read-all
 * (Also supports PUT /api/notifications/read-all)
 * Mark all notifications as read for current user
 */
export async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user._id || req.user.id;
    const result = await notificationService.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result.updatedCount,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
}
