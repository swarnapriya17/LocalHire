const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate registration payload
 */
export function validateRegister(body) {
  const errors = [];
  const normalized = {};

  // 1. Name validation
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters long.');
  } else {
    normalized.name = body.name.trim();
  }

  // 2. Email validation
  if (!body.email || typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    errors.push('A valid email address is required.');
  } else {
    normalized.email = body.email.trim().toLowerCase();
  }

  // 3. Password validation
  if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else {
    normalized.password = body.password;
  }

  // 4. Role validation - Strict public restrictions
  const requestedRole = (body.role || 'jobseeker').toString().toLowerCase().trim();
  
  if (requestedRole === 'admin') {
    errors.push('Administrative accounts cannot be created through public registration.');
  } else if (!['jobseeker', 'recruiter'].includes(requestedRole)) {
    errors.push('Account type must be either "jobseeker" or "recruiter".');
  } else {
    normalized.role = requestedRole;
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: normalized,
  };
}

/**
 * Validate login payload
 */
export function validateLogin(body) {
  const errors = [];
  const normalized = {};

  if (!body.email || typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    errors.push('A valid email address is required.');
  } else {
    normalized.email = body.email.trim().toLowerCase();
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length === 0) {
    errors.push('Password is required.');
  } else {
    normalized.password = body.password;
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: normalized,
  };
}
