import { isDbConnected } from '../config/db.js';
import Notification, { NOTIFICATION_TYPES } from '../models/notification.model.js';

export class NotificationServiceError extends Error {
  constructor(message, statusCode = 400, code = 'NOTIFICATION_ERROR') {
    super(message);
    this.name = 'NotificationServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Isolated in-memory store for Phase 11 unit testing when MongoDB Atlas is disconnected
 */
class TestNotificationStore {
  constructor() {
    this.enabled = false;
    this.notifications = [];
  }

  enable() {
    this.enabled = true;
    this.notifications = [];
  }

  disable() {
    this.enabled = false;
    this.notifications = [];
  }

  clear() {
    this.notifications = [];
  }

  add(notification) {
    const record = {
      _id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRead: false,
      readAt: null,
      ...notification,
    };
    this.notifications.unshift(record);
    return record;
  }

  findById(id) {
    return this.notifications.find((n) => String(n._id || n.id) === String(id)) || null;
  }

  findByRecipient(recipientId) {
    return this.notifications.filter((n) => String(n.recipient) === String(recipientId));
  }
}

export const testNotificationStore = new TestNotificationStore();

function checkDatabaseAccess() {
  if (!isDbConnected() && !testNotificationStore.enabled) {
    throw new NotificationServiceError(
      'Notification operations require an active MongoDB connection.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  }
}

export const notificationService = {
  /**
   * Internal trusted method to dispatch an in-app notification to a user
   * Designed to fail safely without breaking calling business logic
   */
  async createNotification({
    recipient,
    type,
    title,
    message,
    relatedEntityType = null,
    relatedEntityId = null,
    idempotencyKey = null,
  }) {
    if (!recipient || !type || !title || !message) {
      return null;
    }

    try {
      // 1. In-memory test mode
      if (testNotificationStore.enabled) {
        if (idempotencyKey) {
          const existing = testNotificationStore.notifications.find(
            (n) => n.idempotencyKey === idempotencyKey
          );
          if (existing) return existing;
        }

        return testNotificationStore.add({
          recipient: String(recipient),
          type,
          title,
          message,
          relatedEntityType,
          relatedEntityId: relatedEntityId ? String(relatedEntityId) : null,
          idempotencyKey,
        });
      }

      // 2. Active MongoDB Mode
      if (isDbConnected()) {
        if (idempotencyKey) {
          const existing = await Notification.findOne({ idempotencyKey });
          if (existing) return existing.toJSON();
        }

        const notif = await Notification.create({
          recipient,
          type,
          title,
          message,
          relatedEntityType,
          relatedEntityId: relatedEntityId ? String(relatedEntityId) : null,
          idempotencyKey,
        });

        return notif.toJSON();
      }

      // DB is disconnected and not in test mode: return null gracefully without throwing
      return null;
    } catch (err) {
      console.warn('[Notification Dispatch Notice]:', err.message);
      return null;
    }
  },

  /**
   * List paginated notifications for the authenticated recipient
   */
  async getNotifications({ userId, page = 1, limit = 10, isRead } = {}) {
    checkDatabaseAccess();

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    if (testNotificationStore.enabled) {
      let userNotifs = testNotificationStore.findByRecipient(userId);

      if (isRead !== undefined) {
        userNotifs = userNotifs.filter((n) => n.isRead === isRead);
      }

      const total = userNotifs.length;
      const totalPages = Math.ceil(total / pageLimit) || 1;
      const start = (currentPage - 1) * pageLimit;
      const items = userNotifs.slice(start, start + pageLimit);

      const allUserNotifs = testNotificationStore.findByRecipient(userId);
      const unreadCount = allUserNotifs.filter((n) => !n.isRead).length;

      return {
        notifications: items,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          totalPages,
        },
        unreadCount,
      };
    }

    const query = { recipient: userId };
    if (isRead !== undefined) {
      query.isRead = isRead;
    }

    const [total, unreadCount, rawNotifs] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit),
    ]);

    const totalPages = Math.ceil(total / pageLimit) || 1;

    return {
      notifications: rawNotifs.map((n) => n.toJSON()),
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages,
      },
      unreadCount,
    };
  },

  /**
   * Retrieve unread notification count for the authenticated recipient
   */
  async getUnreadCount(userId) {
    checkDatabaseAccess();

    if (testNotificationStore.enabled) {
      const allUserNotifs = testNotificationStore.findByRecipient(userId);
      const unreadCount = allUserNotifs.filter((n) => !n.isRead).length;
      return { unreadCount };
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return { unreadCount };
  },

  /**
   * Mark a specific notification as read, enforcing recipient ownership
   */
  async markAsRead({ notificationId, userId }) {
    checkDatabaseAccess();

    if (testNotificationStore.enabled) {
      const notif = testNotificationStore.findById(notificationId);
      if (!notif) {
        throw new NotificationServiceError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
      }

      if (String(notif.recipient) !== String(userId)) {
        throw new NotificationServiceError(
          'Access denied. You can only update your own notifications.',
          403,
          'FORBIDDEN_OWNERSHIP'
        );
      }

      notif.isRead = true;
      notif.readAt = new Date().toISOString();
      notif.updatedAt = new Date().toISOString();
      return notif;
    }

    const notif = await Notification.findById(notificationId);
    if (!notif) {
      throw new NotificationServiceError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }

    if (String(notif.recipient) !== String(userId)) {
      throw new NotificationServiceError(
        'Access denied. You can only update your own notifications.',
        403,
        'FORBIDDEN_OWNERSHIP'
      );
    }

    notif.isRead = true;
    notif.readAt = new Date();
    await notif.save();

    return notif.toJSON();
  },

  /**
   * Mark all unread notifications as read for the authenticated user
   */
  async markAllAsRead(userId) {
    checkDatabaseAccess();

    if (testNotificationStore.enabled) {
      const userNotifs = testNotificationStore.findByRecipient(userId);
      let count = 0;
      const now = new Date().toISOString();
      for (const n of userNotifs) {
        if (!n.isRead) {
          n.isRead = true;
          n.readAt = now;
          n.updatedAt = now;
          count++;
        }
      }
      return { success: true, updatedCount: count };
    }

    const now = new Date();
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: now } }
    );

    return {
      success: true,
      updatedCount: result.modifiedCount || 0,
    };
  },
};

export default notificationService;
