const VALID_CATEGORIES = [
  'it-software',
  'education',
  'healthcare',
  'retail-sales',
  'office-admin',
  'hospitality',
  'skilled-technical',
  'fresher-opportunities',
];

const VALID_EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract'];
const VALID_WORK_MODES = ['On-site', 'Remote', 'Hybrid'];
const VALID_STATUSES = ['published', 'closed', 'draft'];

/**
 * Validate job creation payload
 */
export function validateCreateJob(body) {
  const errors = [];
  const data = {};

  // Title
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
    errors.push('Job title is required and must be at least 3 characters long.');
  } else {
    data.title = body.title.trim().slice(0, 120);
  }

  // Company
  if (!body.company || typeof body.company !== 'string' || body.company.trim().length < 2) {
    errors.push('Company name is required and must be at least 2 characters long.');
  } else {
    data.company = body.company.trim().slice(0, 100);
  }

  // Town / Mandal
  if (!body.town || typeof body.town !== 'string' || body.town.trim().length === 0) {
    errors.push('Mandal / town location is required (e.g., Bhimavaram, Eluru, etc.).');
  } else {
    data.town = body.town.trim();
  }

  data.locationDetail = typeof body.locationDetail === 'string' ? body.locationDetail.trim() : '';

  // Category
  const cat = (body.category || '').toString().toLowerCase().trim();
  if (!VALID_CATEGORIES.includes(cat)) {
    errors.push(`Category must be one of: [${VALID_CATEGORIES.join(', ')}].`);
  } else {
    data.category = cat;
  }

  // Employment Type
  const emp = (body.employmentType || 'Full-time').toString().trim();
  if (!VALID_EMPLOYMENT_TYPES.includes(emp)) {
    errors.push(`Employment type must be one of: [${VALID_EMPLOYMENT_TYPES.join(', ')}].`);
  } else {
    data.employmentType = emp;
  }

  // Work Mode
  const wm = (body.workMode || 'On-site').toString().trim();
  data.workMode = VALID_WORK_MODES.includes(wm) ? wm : 'On-site';

  // Experience
  data.experience = typeof body.experience === 'string' && body.experience.trim() 
    ? body.experience.trim() 
    : 'Fresher / 0 - 1 Year';

  // isFresher
  data.isFresher = Boolean(body.isFresher) || data.category === 'fresher-opportunities' || data.experience.toLowerCase().includes('fresher');

  // Salary
  data.salary = typeof body.salary === 'string' && body.salary.trim() 
    ? body.salary.trim() 
    : 'Salary Disclosed Upon Request';

  data.salaryMin = typeof body.salaryMin === 'number' ? body.salaryMin : 0;
  data.salaryMax = typeof body.salaryMax === 'number' ? body.salaryMax : 0;

  // Description
  if (!body.description || typeof body.description !== 'string' || body.description.trim().length < 20) {
    errors.push('Job description is required and must be at least 20 characters long.');
  } else {
    data.description = body.description.trim();
  }

  // Array fields
  const parseArray = (val) => {
    if (Array.isArray(val)) {
      return val.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof val === 'string' && val.trim()) {
      return val.split('\n').map((item) => item.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
    }
    return [];
  };

  data.responsibilities = parseArray(body.responsibilities);
  data.requirements = parseArray(body.requirements);
  data.perks = parseArray(body.perks);

  // Status
  const status = (body.status || 'published').toString().toLowerCase().trim();
  data.status = VALID_STATUSES.includes(status) ? status : 'published';
  data.urgency = typeof body.urgency === 'string' && body.urgency.trim() ? body.urgency.trim() : 'Standard';
  data.verificationStatus = typeof body.verificationStatus === 'string' && body.verificationStatus.trim() 
    ? body.verificationStatus.trim() 
    : 'Verified Local Opening';

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

/**
 * Validate job update payload
 */
export function validateUpdateJob(body) {
  const errors = [];
  const data = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 3) {
      errors.push('Job title must be at least 3 characters long.');
    } else {
      data.title = body.title.trim().slice(0, 120);
    }
  }

  if (body.company !== undefined) {
    if (typeof body.company !== 'string' || body.company.trim().length < 2) {
      errors.push('Company name must be at least 2 characters long.');
    } else {
      data.company = body.company.trim().slice(0, 100);
    }
  }

  if (body.town !== undefined) {
    if (typeof body.town !== 'string' || body.town.trim().length === 0) {
      errors.push('Town location cannot be empty.');
    } else {
      data.town = body.town.trim();
    }
  }

  if (body.locationDetail !== undefined) {
    data.locationDetail = String(body.locationDetail).trim();
  }

  if (body.category !== undefined) {
    const cat = String(body.category).toLowerCase().trim();
    if (!VALID_CATEGORIES.includes(cat)) {
      errors.push(`Category must be one of: [${VALID_CATEGORIES.join(', ')}].`);
    } else {
      data.category = cat;
    }
  }

  if (body.employmentType !== undefined) {
    const emp = String(body.employmentType).trim();
    if (!VALID_EMPLOYMENT_TYPES.includes(emp)) {
      errors.push(`Employment type must be one of: [${VALID_EMPLOYMENT_TYPES.join(', ')}].`);
    } else {
      data.employmentType = emp;
    }
  }

  if (body.workMode !== undefined) {
    const wm = String(body.workMode).trim();
    if (VALID_WORK_MODES.includes(wm)) {
      data.workMode = wm;
    }
  }

  if (body.experience !== undefined) {
    data.experience = String(body.experience).trim();
  }

  if (body.isFresher !== undefined) {
    data.isFresher = Boolean(body.isFresher);
  }

  if (body.salary !== undefined) {
    data.salary = String(body.salary).trim();
  }

  if (body.salaryMin !== undefined) {
    data.salaryMin = Number(body.salaryMin) || 0;
  }

  if (body.salaryMax !== undefined) {
    data.salaryMax = Number(body.salaryMax) || 0;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.trim().length < 20) {
      errors.push('Job description must be at least 20 characters long.');
    } else {
      data.description = body.description.trim();
    }
  }

  const parseArray = (val) => {
    if (Array.isArray(val)) {
      return val.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof val === 'string' && val.trim()) {
      return val.split('\n').map((item) => item.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
    }
    return undefined;
  };

  if (body.responsibilities !== undefined) {
    data.responsibilities = parseArray(body.responsibilities);
  }
  if (body.requirements !== undefined) {
    data.requirements = parseArray(body.requirements);
  }
  if (body.perks !== undefined) {
    data.perks = parseArray(body.perks);
  }

  if (body.status !== undefined) {
    const status = String(body.status).toLowerCase().trim();
    if (VALID_STATUSES.includes(status)) {
      data.status = status;
    } else {
      errors.push(`Status must be one of: [${VALID_STATUSES.join(', ')}].`);
    }
  }

  if (body.urgency !== undefined) {
    data.urgency = String(body.urgency).trim();
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}
