/**
 * Profile Completeness Calculator (Frontend Helper)
 * 
 * Rules:
 * - Freshers are treated as first-class candidates and are NEVER penalized for lacking work experience.
 * - Score range: 0 to 100%.
 * - Disclaimers: Profile completeness reflects profile detail for recruiter search visibility,
 *   not a guaranteed measure of employability.
 */
export function calculateProfileCompleteness(user, formProfile = null) {
  const profile = formProfile || user?.jobseekerProfile || {};
  const userName = formProfile?.name || user?.name || '';
  const isFresher = profile.isFresher !== false && (!profile.workExperience || profile.workExperience.length === 0 || profile.isFresher === true);

  const sections = {
    personal: {
      completed: false,
      weight: isFresher ? 25 : 20,
      label: 'Personal Information',
      suggestion: 'Add your professional headline, career summary, and West Godavari town.',
    },
    education: {
      completed: false,
      weight: isFresher ? 25 : 20,
      label: 'Education',
      suggestion: 'List at least one educational qualification (degree, college, graduation year).',
    },
    skills: {
      completed: false,
      weight: isFresher ? 20 : 15,
      label: 'Skills & Competencies',
      suggestion: 'List at least 3 technical or soft skills to highlight your abilities.',
    },
    experience: {
      completed: false,
      weight: isFresher ? 0 : 20,
      label: 'Work Experience',
      suggestion: isFresher
        ? 'Optional for freshers. Add internships or apprenticeships if completed.'
        : 'Add at least one corporate employment or internship experience.',
    },
    projectsCertifications: {
      completed: false,
      weight: isFresher ? 20 : 15,
      label: 'Projects & Certifications',
      suggestion: 'Add at least one academic/personal project or verified skill certification.',
    },
    preferences: {
      completed: false,
      weight: 10,
      label: 'Job Preferences',
      suggestion: 'Specify your preferred West Godavari locations and target job sectors.',
    },
  };

  // 1. Personal Section
  const hasName = Boolean(userName && userName.trim().length >= 2);
  const hasHeadline = Boolean(profile.headline && profile.headline.trim().length > 0);
  const hasSummary = Boolean(profile.summary && profile.summary.trim().length > 0);
  const hasLocation = Boolean(profile.location && profile.location.trim().length > 0);
  if (hasName && hasHeadline && (hasSummary || hasLocation)) {
    sections.personal.completed = true;
  }

  // 2. Education Section
  if (Array.isArray(profile.education) && profile.education.length > 0) {
    const validEdu = profile.education.some(
      (e) => (e.institution && e.institution.trim()) && (e.degree && e.degree.trim())
    );
    if (validEdu) {
      sections.education.completed = true;
    }
  }

  // 3. Skills Section
  const technicalCount = Array.isArray(profile.skills) ? profile.skills.filter(Boolean).length : 0;
  const softCount = Array.isArray(profile.softSkills) ? profile.softSkills.filter(Boolean).length : 0;
  if (technicalCount + softCount >= 3) {
    sections.skills.completed = true;
  }

  // 4. Experience Section
  if (!isFresher) {
    if (Array.isArray(profile.workExperience) && profile.workExperience.length > 0) {
      const validExp = profile.workExperience.some(
        (exp) => (exp.company && exp.company.trim()) && (exp.title && exp.title.trim())
      );
      if (validExp) {
        sections.experience.completed = true;
      }
    }
  } else {
    sections.experience.completed = true;
  }

  // 5. Projects or Certifications Section
  const hasProjects = Array.isArray(profile.projects) && profile.projects.some((p) => p.title && p.title.trim());
  const hasCerts = Array.isArray(profile.certifications) && profile.certifications.some((c) => c.name && c.name.trim());
  if (hasProjects || hasCerts) {
    sections.projectsCertifications.completed = true;
  }

  // 6. Preferences Section
  const prefs = profile.jobPreferences || {};
  const hasLocations = Array.isArray(prefs.preferredLocations) && prefs.preferredLocations.length > 0;
  const hasCategories = Array.isArray(prefs.categories) && prefs.categories.length > 0;
  if (hasLocations || hasCategories || prefs.experienceLevel) {
    sections.preferences.completed = true;
  }

  // Compute final score
  let totalScore = 0;
  const incompleteSuggestions = [];

  for (const key of Object.keys(sections)) {
    const sec = sections[key];
    if (sec.completed) {
      totalScore += sec.weight;
    } else {
      incompleteSuggestions.push(sec.suggestion);
    }
  }

  const score = Math.min(100, Math.max(0, Math.round(totalScore)));

  return {
    score,
    isFresher,
    sections,
    incompleteSuggestions,
    disclaimer: 'Profile completeness measures profile detail and readiness for recruiter discovery; it is not a certification or guarantee of employability.',
  };
}

export default calculateProfileCompleteness;
