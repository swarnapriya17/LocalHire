/**
 * Validation rules for Notification endpoints (Phase 11)
 */

export function validateNotificationQuery(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));

  let isRead = undefined;
  if (query.isRead !== undefined) {
    if (query.isRead === 'true' || query.isRead === true) isRead = true;
    else if (query.isRead === 'false' || query.isRead === false) isRead = false;
  }

  return {
    isValid: true,
    sanitized: {
      page,
      limit,
      isRead,
    },
  };
}

export function validateNotificationId(id) {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return {
      isValid: false,
      error: 'Valid notification ID is required',
    };
  }
  return {
    isValid: true,
    sanitizedId: id.trim(),
  };
}
