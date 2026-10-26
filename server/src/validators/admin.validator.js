/**
 * Validation rules for Admin Dashboard & Trust Management (Phase 9)
 */

export function validateUserStatusUpdate(data) {
  const errors = [];
  const allowedStatuses = ['active', 'suspended'];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a JSON object'],
      sanitized: null,
    };
  }

  // Check for forbidden privilege escalation or sensitive fields
  const forbiddenFields = ['role', 'password', 'passwordHash', 'email', 'isVerified', '_id'];
  for (const field of forbiddenFields) {
    if (data[field] !== undefined) {
      errors.push(`Field '${field}' cannot be modified through account status management`);
    }
  }

  if (!data.accountStatus || !allowedStatuses.includes(data.accountStatus)) {
    errors.push(`Account status must be one of: [${allowedStatuses.join(', ')}]`);
  }

  const sanitized = {
    accountStatus: data.accountStatus,
    reason: typeof data.reason === 'string' ? data.reason.trim().slice(0, 300) : '',
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null,
  };
}

export function validateEmployerVerification(data) {
  const errors = [];
  const allowedStatuses = ['approved', 'rejected'];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a JSON object'],
      sanitized: null,
    };
  }

  if (!data.status || !allowedStatuses.includes(data.status)) {
    errors.push(`Verification status must be either 'approved' or 'rejected'`);
  }

  const sanitized = {
    status: data.status,
    reason: typeof data.reason === 'string' ? data.reason.trim().slice(0, 500) : '',
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null,
  };
}

export function validateJobModeration(data) {
  const errors = [];
  const allowedActions = ['approve', 'reject', 'flag', 'unpublish'];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a JSON object'],
      sanitized: null,
    };
  }

  if (!data.action || !allowedActions.includes(data.action)) {
    errors.push(`Moderation action must be one of: [${allowedActions.join(', ')}]`);
  }

  const sanitized = {
    action: data.action,
    notes: typeof data.notes === 'string' ? data.notes.trim().slice(0, 500) : '',
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null,
  };
}
