import { APPLICATION_STATUSES } from '../models/application.model.js';

const URL_REGEX = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false;
  const trimmed = string.trim();
  if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
    return false;
  }
  return URL_REGEX.test(trimmed);
}

/**
 * Validates payload for candidate application submission (POST /api/applications)
 */
export function validateCreateApplication(body = {}) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a valid JSON object.'],
      data: null,
    };
  }

  // Security allowlisting: prevent candidate from setting unauthorized fields
  const forbiddenFields = ['status', 'statusHistory', 'recruiterNotes', 'interviewDetails', 'applicant'];
  for (const field of forbiddenFields) {
    if (body[field] !== undefined) {
      errors.push(`Modification of protected field "${field}" is not allowed during application submission.`);
    }
  }

  // Validate jobId
  const jobId = body.jobId || body.job;
  if (!jobId || typeof jobId !== 'string' || !jobId.trim()) {
    errors.push('A valid jobId reference is required to submit an application.');
  }

  // Validate coverLetter (optional)
  let coverLetter = '';
  if (body.coverLetter !== undefined) {
    if (typeof body.coverLetter !== 'string') {
      errors.push('Cover letter must be a text string.');
    } else if (body.coverLetter.trim().length > 2500) {
      errors.push('Cover letter exceeds maximum allowed length of 2500 characters.');
    } else {
      coverLetter = body.coverLetter.trim();
    }
  }

  // Validate resumeUrl (optional remote document link)
  let resumeUrl = '';
  if (body.resumeUrl !== undefined && body.resumeUrl !== null && body.resumeUrl !== '') {
    if (typeof body.resumeUrl !== 'string' || !isValidHttpUrl(body.resumeUrl)) {
      errors.push('Resume document link must be a valid http:// or https:// URL.');
    } else {
      resumeUrl = body.resumeUrl.trim();
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      jobId: String(jobId).trim(),
      coverLetter,
      resumeUrl,
    } : null,
  };
}

/**
 * Validates payload for recruiter status updates (PATCH /api/applications/:id/status)
 */
export function validateUpdateStatus(body = {}) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a valid JSON object.'],
      data: null,
    };
  }

  // Validate status
  const { status, notes, recruiterNotes, interviewDetails } = body;

  if (!status || typeof status !== 'string') {
    errors.push(`Application status is required and must be one of: [${APPLICATION_STATUSES.join(', ')}].`);
  } else if (!APPLICATION_STATUSES.includes(status)) {
    errors.push(`Invalid application status "${status}". Allowed values: [${APPLICATION_STATUSES.join(', ')}].`);
  }

  // Validate notes
  let sanitizedNotes = '';
  const noteContent = notes || recruiterNotes;
  if (noteContent !== undefined) {
    if (typeof noteContent !== 'string') {
      errors.push('Recruiter notes must be a text string.');
    } else if (noteContent.trim().length > 2000) {
      errors.push('Recruiter notes exceed maximum allowed length of 2000 characters.');
    } else {
      sanitizedNotes = noteContent.trim();
    }
  }

  // Validate interviewDetails if status is 'Interview Scheduled'
  let sanitizedInterview = null;
  if (status === 'Interview Scheduled') {
    if (!interviewDetails || typeof interviewDetails !== 'object') {
      errors.push('Interview details (date, time, or instructions) are required when status is set to "Interview Scheduled".');
    } else {
      const { interviewDate, interviewTime, meetingLink, location, notes: intNotes } = interviewDetails;

      if (!interviewDate && !interviewTime) {
        errors.push('Please specify at least an interview date or time when scheduling an interview.');
      }

      if (meetingLink && (typeof meetingLink !== 'string' || !isValidHttpUrl(meetingLink))) {
        errors.push('Meeting link must be a valid http:// or https:// URL (e.g. Google Meet or Zoom).');
      }

      sanitizedInterview = {
        interviewDate: typeof interviewDate === 'string' ? interviewDate.trim() : '',
        interviewTime: typeof interviewTime === 'string' ? interviewTime.trim() : '',
        meetingLink: typeof meetingLink === 'string' ? meetingLink.trim() : '',
        location: typeof location === 'string' ? location.trim() : '',
        notes: typeof intNotes === 'string' ? intNotes.trim() : '',
      };
    }
  } else if (interviewDetails && typeof interviewDetails === 'object') {
    // If interview details are provided with another status, sanitize them
    sanitizedInterview = {
      interviewDate: typeof interviewDetails.interviewDate === 'string' ? interviewDetails.interviewDate.trim() : '',
      interviewTime: typeof interviewDetails.interviewTime === 'string' ? interviewDetails.interviewTime.trim() : '',
      meetingLink: typeof interviewDetails.meetingLink === 'string' && isValidHttpUrl(interviewDetails.meetingLink) ? interviewDetails.meetingLink.trim() : '',
      location: typeof interviewDetails.location === 'string' ? interviewDetails.location.trim() : '',
      notes: typeof interviewDetails.notes === 'string' ? interviewDetails.notes.trim() : '',
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      status,
      notes: sanitizedNotes,
      interviewDetails: sanitizedInterview,
    } : null,
  };
}
