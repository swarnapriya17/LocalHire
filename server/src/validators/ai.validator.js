/**
 * Input validation and sanitization for Phase 10: AI Career Assistant
 */

export function validateCareerChat(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a JSON object'],
      sanitized: null,
    };
  }

  const rawMessage = typeof data.message === 'string' ? data.message.trim() : '';
  if (!rawMessage) {
    errors.push('Message is required and cannot be empty');
  } else if (rawMessage.length < 2) {
    errors.push('Message must be at least 2 characters long');
  } else if (rawMessage.length > 2000) {
    errors.push('Message cannot exceed 2,000 characters');
  }

  const sanitizedHistory = [];
  if (data.history !== undefined) {
    if (!Array.isArray(data.history)) {
      errors.push('Conversation history must be an array of messages');
    } else {
      // Only keep the most recent 10 messages for token hygiene and rate prevention
      const recentHistory = data.history.slice(-10);
      for (const item of recentHistory) {
        if (!item || typeof item !== 'object') continue;
        const role = item.role === 'assistant' ? 'assistant' : item.role === 'user' ? 'user' : null;
        const content = typeof item.content === 'string' ? item.content.trim().slice(0, 2000) : '';
        if (role && content) {
          sanitizedHistory.push({ role, content });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? { message: rawMessage, history: sanitizedHistory } : null,
  };
}

export function validateProfileReview(data) {
  const errors = [];
  const body = data && typeof data === 'object' ? data : {};

  const useStoredProfile = body.useStoredProfile !== false;
  let customProfile = null;

  if (body.profileData && typeof body.profileData === 'object') {
    const rawHeadline = typeof body.profileData.headline === 'string' ? body.profileData.headline.trim().slice(0, 200) : '';
    const rawSummary = typeof body.profileData.summary === 'string' ? body.profileData.summary.trim().slice(0, 2000) : '';
    const rawSkills = Array.isArray(body.profileData.skills)
      ? body.profileData.skills.filter((s) => typeof s === 'string').map((s) => s.trim().slice(0, 50)).slice(0, 50)
      : [];
    const targetRole = typeof body.profileData.targetRole === 'string' ? body.profileData.targetRole.trim().slice(0, 100) : '';

    customProfile = {
      headline: rawHeadline,
      summary: rawSummary,
      skills: rawSkills,
      targetRole,
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      useStoredProfile,
      customProfile,
    },
  };
}

export function validateSkillGap(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a JSON object'],
      sanitized: null,
    };
  }

  const targetRole = typeof data.targetRole === 'string' ? data.targetRole.trim() : '';
  if (!targetRole) {
    errors.push('Target role or career objective is required');
  } else if (targetRole.length > 120) {
    errors.push('Target role cannot exceed 120 characters');
  }

  let skills = [];
  if (Array.isArray(data.currentSkills)) {
    skills = data.currentSkills
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim().slice(0, 50))
      .slice(0, 50);
  }

  const jobDescription = typeof data.jobDescription === 'string' ? data.jobDescription.trim().slice(0, 4000) : '';

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? { targetRole, currentSkills: skills, jobDescription } : null,
  };
}

export function validateInterviewQuestions(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a JSON object'],
      sanitized: null,
    };
  }

  const role = typeof data.role === 'string' ? data.role.trim() : '';
  if (!role) {
    errors.push('Job role is required to generate targeted interview questions');
  } else if (role.length > 120) {
    errors.push('Job role cannot exceed 120 characters');
  }

  const experienceLevel = typeof data.experienceLevel === 'string' ? data.experienceLevel.trim().slice(0, 50) : 'Fresher / Entry-Level';
  const category = typeof data.category === 'string' ? data.category.trim().slice(0, 50) : '';
  const jobDescription = typeof data.jobDescription === 'string' ? data.jobDescription.trim().slice(0, 4000) : '';

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? { role, experienceLevel, category, jobDescription } : null,
  };
}

export function validateInterviewFeedback(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a JSON object'],
      sanitized: null,
    };
  }

  const question = typeof data.question === 'string' ? data.question.trim() : '';
  if (!question) {
    errors.push('Interview question is required');
  } else if (question.length > 1000) {
    errors.push('Question cannot exceed 1,000 characters');
  }

  const answer = typeof data.answer === 'string' ? data.answer.trim() : '';
  if (!answer) {
    errors.push('Candidate practice answer is required');
  } else if (answer.length < 10) {
    errors.push('Answer must be at least 10 characters long to provide meaningful feedback');
  } else if (answer.length > 4000) {
    errors.push('Answer cannot exceed 4,000 characters');
  }

  const role = typeof data.role === 'string' ? data.role.trim().slice(0, 100) : '';

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? { question, answer, role } : null,
  };
}
