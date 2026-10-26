const URL_REGEX = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;

function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false;
  const trimmed = string.trim();
  if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
    return false;
  }
  return URL_REGEX.test(trimmed);
}

/**
 * Validates payload for recruiter company & employer profile update (PUT /api/recruiter/profile)
 */
export function validateRecruiterProfileUpdate(body = {}) {
  const errors = [];
  const sanitized = {};

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: ['Profile update payload must be a valid JSON object.'],
      data: null,
    };
  }

  // 1. Strict Security Allowlisting: Reject tampering with sensitive account or authorization fields
  const forbiddenFields = [
    'role',
    'accountStatus',
    'password',
    'passwordHash',
    'email',
    '_id',
    'id',
    'isVerified',
    'verifiedEmployer',
  ];

  for (const field of forbiddenFields) {
    if (body[field] !== undefined) {
      errors.push(`Modification of sensitive field "${field}" is not allowed through profile updates.`);
    }
  }

  // 2. Recruiter Personal Name
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long.');
    } else {
      sanitized.name = body.name.trim().slice(0, 100);
    }
  }

  // 3. Recruiter Company Subfields
  const rp = body.recruiterProfile || body;
  const companyData = {};

  if (rp.companyName !== undefined) {
    if (typeof rp.companyName !== 'string' || rp.companyName.trim().length < 2) {
      errors.push('Company name must be at least 2 characters long.');
    } else {
      companyData.companyName = rp.companyName.trim().slice(0, 120);
    }
  }

  if (rp.companyDescription !== undefined) {
    if (typeof rp.companyDescription !== 'string') {
      errors.push('Company description must be a string.');
    } else if (rp.companyDescription.trim().length > 2000) {
      errors.push('Company description cannot exceed 2000 characters.');
    } else {
      companyData.companyDescription = rp.companyDescription.trim();
    }
  }

  if (rp.industry !== undefined) {
    companyData.industry = String(rp.industry).trim().slice(0, 100);
  }

  if (rp.designation !== undefined) {
    companyData.designation = String(rp.designation).trim().slice(0, 100);
  }

  if (rp.location !== undefined) {
    companyData.location = String(rp.location).trim().slice(0, 100);
  }

  if (rp.town !== undefined) {
    companyData.town = String(rp.town).trim().slice(0, 80);
  }

  if (rp.address !== undefined) {
    companyData.address = String(rp.address).trim().slice(0, 250);
  }

  if (rp.companyWebsite !== undefined && rp.companyWebsite !== null && rp.companyWebsite !== '') {
    if (typeof rp.companyWebsite !== 'string' || !isValidHttpUrl(rp.companyWebsite)) {
      errors.push('Company website URL format is invalid. Please include http:// or https://.');
    } else {
      companyData.companyWebsite = rp.companyWebsite.trim();
    }
  } else if (rp.companyWebsite === '') {
    companyData.companyWebsite = '';
  }

  if (rp.logoUrl !== undefined && rp.logoUrl !== null && rp.logoUrl !== '') {
    if (typeof rp.logoUrl !== 'string' || !isValidHttpUrl(rp.logoUrl)) {
      errors.push('Company logo URL format is invalid. Please include http:// or https://.');
    } else {
      companyData.logoUrl = rp.logoUrl.trim();
    }
  } else if (rp.logoUrl === '') {
    companyData.logoUrl = '';
  }

  if (rp.contactEmail !== undefined && rp.contactEmail !== null && rp.contactEmail !== '') {
    if (typeof rp.contactEmail !== 'string' || !EMAIL_REGEX.test(rp.contactEmail.trim())) {
      errors.push('Public contact email format is invalid.');
    } else {
      companyData.contactEmail = rp.contactEmail.trim().toLowerCase();
    }
  } else if (rp.contactEmail === '') {
    companyData.contactEmail = '';
  }

  if (rp.phone !== undefined && rp.phone !== null && rp.phone !== '') {
    const ph = String(rp.phone).trim();
    const digitsOnly = ph.replace(/\D/g, '');
    if (!PHONE_REGEX.test(ph) || digitsOnly.length < 7 || digitsOnly.length > 15) {
      errors.push('Phone number format is invalid.');
    } else {
      companyData.phone = ph;
    }
  } else if (rp.phone === '') {
    companyData.phone = '';
  }

  sanitized.recruiterProfile = companyData;

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? sanitized : null,
  };
}
