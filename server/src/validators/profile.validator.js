const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

function isValidUrl(str) {
  if (!str) return true;
  const trimmed = str.trim();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) return false;
  return URL_REGEX.test(trimmed);
}

/**
 * Validate Job Seeker Profile update payload
 */
export function validateProfileUpdate(body) {
  const errors = [];
  const sanitized = {};

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: ['Profile update payload must be an object.'],
      data: {},
    };
  }

  // 1. Strict Security Allowlisting: Reject tampering with sensitive account fields
  const forbiddenFields = ['role', 'accountStatus', 'password', 'passwordHash', 'email', '_id', 'id', 'isVerified'];
  for (const field of forbiddenFields) {
    if (body[field] !== undefined) {
      errors.push(`Modification of sensitive field "${field}" is not allowed through profile updates.`);
    }
  }

  // 2. Full Name
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long.');
    } else {
      sanitized.name = body.name.trim().slice(0, 100);
    }
  }

  // 3. Job Seeker Profile Subfields
  const p = body.jobseekerProfile || body;
  const profileData = {};

  if (p.headline !== undefined) {
    profileData.headline = String(p.headline).trim().slice(0, 150);
  }

  if (p.summary !== undefined) {
    profileData.summary = String(p.summary).trim().slice(0, 1000);
  }

  if (p.location !== undefined) {
    profileData.location = String(p.location).trim().slice(0, 100);
  }

  if (p.phone !== undefined) {
    const ph = String(p.phone).trim();
    const digits = ph.replace(/\D/g, '');
    if (ph && (digits.length < 7 || digits.length > 15 || !/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/.test(ph))) {
      errors.push('Phone number format is invalid.');
    } else {
      profileData.phone = ph;
    }
  }

  if (p.isFresher !== undefined) {
    profileData.isFresher = Boolean(p.isFresher);
  }

  if (p.experienceLevel !== undefined) {
    profileData.experienceLevel = String(p.experienceLevel).trim();
  }

  // Portfolio Links
  if (p.portfolioLinks && typeof p.portfolioLinks === 'object') {
    const links = {};
    if (p.portfolioLinks.portfolio !== undefined) {
      const u = String(p.portfolioLinks.portfolio).trim();
      if (u && !isValidUrl(u)) {
        errors.push('Portfolio website URL format is invalid.');
      } else {
        links.portfolio = u;
      }
    }
    if (p.portfolioLinks.github !== undefined) {
      const u = String(p.portfolioLinks.github).trim();
      if (u && !isValidUrl(u)) {
        errors.push('GitHub profile URL format is invalid.');
      } else {
        links.github = u;
      }
    }
    if (p.portfolioLinks.linkedin !== undefined) {
      const u = String(p.portfolioLinks.linkedin).trim();
      if (u && !isValidUrl(u)) {
        errors.push('LinkedIn profile URL format is invalid.');
      } else {
        links.linkedin = u;
      }
    }
    profileData.portfolioLinks = links;
  }

  // Skills
  if (p.skills !== undefined) {
    if (Array.isArray(p.skills)) {
      profileData.skills = p.skills.map((s) => String(s).trim()).filter(Boolean);
    } else {
      errors.push('Technical skills must be provided as an array.');
    }
  }

  if (p.softSkills !== undefined) {
    if (Array.isArray(p.softSkills)) {
      profileData.softSkills = p.softSkills.map((s) => String(s).trim()).filter(Boolean);
    } else {
      errors.push('Soft skills must be provided as an array.');
    }
  }

  // Education
  if (p.education !== undefined) {
    if (!Array.isArray(p.education)) {
      errors.push('Education must be an array of qualifications.');
    } else {
      profileData.education = p.education.map((edu, idx) => {
        if (!edu.institution || !edu.degree) {
          errors.push(`Education entry #${idx + 1} must include institution and degree.`);
        }
        return {
          institution: String(edu.institution || '').trim(),
          degree: String(edu.degree || '').trim(),
          fieldOfStudy: String(edu.fieldOfStudy || '').trim(),
          graduationYear: String(edu.graduationYear || '').trim(),
          grade: String(edu.grade || '').trim(),
        };
      });
    }
  }

  // Work Experience
  if (p.workExperience !== undefined) {
    if (!Array.isArray(p.workExperience)) {
      errors.push('Work experience must be an array of employment records.');
    } else {
      profileData.workExperience = p.workExperience.map((exp, idx) => {
        if (!exp.title || !exp.company) {
          errors.push(`Work experience entry #${idx + 1} must include title and company.`);
        }
        return {
          title: String(exp.title || '').trim(),
          company: String(exp.company || '').trim(),
          location: String(exp.location || '').trim(),
          startDate: String(exp.startDate || '').trim(),
          endDate: String(exp.endDate || '').trim(),
          isCurrent: Boolean(exp.isCurrent),
          description: String(exp.description || '').trim(),
        };
      });
    }
  }

  // Projects
  if (p.projects !== undefined) {
    if (!Array.isArray(p.projects)) {
      errors.push('Projects must be an array.');
    } else {
      profileData.projects = p.projects.map((proj, idx) => {
        if (!proj.title) {
          errors.push(`Project #${idx + 1} must include a title.`);
        }
        const link = String(proj.link || proj.projectUrl || '').trim();
        if (link && !isValidUrl(link)) {
          errors.push(`Project #${idx + 1} link format is invalid.`);
        }
        return {
          title: String(proj.title || '').trim(),
          description: String(proj.description || '').trim(),
          technologies: Array.isArray(proj.technologies) ? proj.technologies.map((t) => String(t).trim()).filter(Boolean) : [],
          link,
        };
      });
    }
  }

  // Certifications
  if (p.certifications !== undefined) {
    if (!Array.isArray(p.certifications)) {
      errors.push('Certifications must be an array.');
    } else {
      profileData.certifications = p.certifications.map((cert, idx) => {
        if (!cert.name) {
          errors.push(`Certification #${idx + 1} must include a name.`);
        }
        const credentialUrl = String(cert.credentialUrl || '').trim();
        if (credentialUrl && !isValidUrl(credentialUrl)) {
          errors.push(`Certification #${idx + 1} credential URL format is invalid.`);
        }
        return {
          name: String(cert.name || '').trim(),
          issuingOrganization: String(cert.issuingOrganization || '').trim(),
          issueDate: String(cert.issueDate || '').trim(),
          credentialUrl,
        };
      });
    }
  }

  // Job Preferences
  if (p.jobPreferences && typeof p.jobPreferences === 'object') {
    profileData.jobPreferences = {
      preferredLocations: Array.isArray(p.jobPreferences.preferredLocations)
        ? p.jobPreferences.preferredLocations.map((l) => String(l).trim()).filter(Boolean)
        : [],
      categories: Array.isArray(p.jobPreferences.categories)
        ? p.jobPreferences.categories.map((c) => String(c).trim()).filter(Boolean)
        : [],
      employmentTypes: Array.isArray(p.jobPreferences.employmentTypes)
        ? p.jobPreferences.employmentTypes.map((e) => String(e).trim()).filter(Boolean)
        : [],
      workModes: Array.isArray(p.jobPreferences.workModes)
        ? p.jobPreferences.workModes.map((w) => String(w).trim()).filter(Boolean)
        : [],
      experienceLevel: String(p.jobPreferences.experienceLevel || 'Fresher / Entry-Level').trim(),
      expectedSalary: String(p.jobPreferences.expectedSalary || '').trim(),
    };
  }

  // Privacy Settings
  if (p.privacySettings && typeof p.privacySettings === 'object') {
    profileData.privacySettings = {
      visibleToRecruiters: p.privacySettings.visibleToRecruiters !== false,
      allowContact: p.privacySettings.allowContact !== false,
    };
  }

  sanitized.jobseekerProfile = profileData;

  return {
    isValid: errors.length === 0,
    errors,
    data: sanitized,
  };
}
