/**
 * Central API Client configuration for LocalHire
 * Automatically routes through Vite dev proxy (/api) or custom VITE_API_URL environment variable.
 * Includes credentials: 'include' for HTTP-only cookie-based authentication.
 */

// If VITE_API_URL is provided, use it (trimming any trailing slash), otherwise default to '/api'
const BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') 
  : '/api';

/**
 * Standard fetch wrapper with credentials and error handling
 */
export async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      credentials: 'include', // Automatically include HTTP-only authentication cookies
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = data?.error?.code;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (endpoint !== '/auth/me') {
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, error.message);
    }
    throw error;
  }
}

/**
 * Authentication service methods
 */
export const authService = {
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request('/auth/me', {
      method: 'GET',
    }),

  testJobSeekerAccess: () => request('/auth/test/jobseeker'),
  testRecruiterAccess: () => request('/auth/test/recruiter'),
  testAdminAccess: () => request('/auth/test/admin'),
};

/**
 * System health check service
 */
export const healthService = {
  getHealth: () => request('/health'),
};

/**
 * Job vacancy management service
 */
export const jobService = {
  getJobs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.town && params.town !== 'all') query.set('town', params.town);
    if (params.location && params.location !== 'all') query.set('town', params.location);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.experience && params.experience !== 'all') query.set('experience', params.experience);
    if (params.isFresher !== undefined && params.isFresher !== '') query.set('isFresher', params.isFresher);
    if (params.employmentType && params.employmentType !== 'all') query.set('employmentType', params.employmentType);
    if (params.workMode && params.workMode !== 'all') query.set('workMode', params.workMode);
    if (params.salaryMin) query.set('salaryMin', params.salaryMin);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const queryString = query.toString();
    return request(`/jobs${queryString ? `?${queryString}` : ''}`);
  },

  getJobById: (id) => request(`/jobs/${id}`),

  getMyJobs: () => request('/jobs/recruiter/my-jobs'),

  createJob: (jobData) =>
    request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),

  updateJob: (id, jobData) =>
    request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    }),

  deleteJob: (id) =>
    request(`/jobs/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * User and Job Seeker Profile service methods
 */
export const userService = {
  getProfile: () => request('/users/profile'),
  updateProfile: (profileData) =>
    request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  getCandidateProfile: (id) => request(`/users/jobseeker/${id}`),
};

/**
 * Job Applications and Tracking service methods (Phase 7)
 */
export const applicationService = {
  submitApplication: (applicationData) =>
    request('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    }),

  getMyApplications: () => request('/applications/my'),

  getJobApplications: (jobId) => request(`/applications/job/${jobId}`),

  getApplication: (id) => request(`/applications/${id}`),

  updateApplicationStatus: (id, statusData) =>
    request(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    }),
};

/**
 * Recruiter & Employer Management service methods (Phase 8)
 */
export const recruiterService = {
  getSummary: () => request('/recruiter/summary'),
  getProfile: () => request('/recruiter/profile'),
  updateProfile: (profileData) =>
    request('/recruiter/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  getAnalytics: () => request('/recruiter/analytics'),
  getInterviews: () => request('/recruiter/interviews'),
};

/**
 * Admin Dashboard & Trust Management service methods (Phase 9)
 */
export const adminService = {
  getSummary: () => request('/admin/summary'),
  getUsers: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.role) searchParams.set('role', params.role);
    if (params.accountStatus) searchParams.set('accountStatus', params.accountStatus);
    if (params.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return request(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  getUser: (id) => request(`/admin/users/${id}`),
  updateUserStatus: (id, { accountStatus, reason }) =>
    request(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ accountStatus, reason }),
    }),
  getVerificationQueue: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    return request(`/admin/employers/verification-queue${qs ? `?${qs}` : ''}`);
  },
  reviewEmployerVerification: (id, { status, reason }) =>
    request(`/admin/employers/${id}/verification`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    }),
  getJobsForModeration: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.moderationStatus) searchParams.set('moderationStatus', params.moderationStatus);
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return request(`/admin/jobs${qs ? `?${qs}` : ''}`);
  },
  moderateJob: (id, { action, notes }) =>
    request(`/admin/jobs/${id}/moderate`, {
      method: 'PUT',
      body: JSON.stringify({ action, notes }),
    }),
  getAuditLogs: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.action) searchParams.set('action', params.action);
    if (params.targetType) searchParams.set('targetType', params.targetType);
    const qs = searchParams.toString();
    return request(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

/**
 * Phase 10: AI Career Assistant service methods
 */
export const aiService = {
  getStatus: () => request('/ai/status'),
  chat: ({ message, history }) =>
    request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
  reviewProfile: ({ customProfile } = {}) =>
    request('/ai/profile-review', {
      method: 'POST',
      body: JSON.stringify({ profileData: customProfile }),
    }),
  analyzeSkillGap: ({ targetRole, currentSkills, jobDescription }) =>
    request('/ai/skill-gap', {
      method: 'POST',
      body: JSON.stringify({ targetRole, currentSkills, jobDescription }),
    }),
  generateInterviewQuestions: ({ role, experienceLevel, category, jobDescription }) =>
    request('/ai/interview/questions', {
      method: 'POST',
      body: JSON.stringify({ role, experienceLevel, category, jobDescription }),
    }),
  provideInterviewFeedback: ({ question, answer, role }) =>
    request('/ai/interview/feedback', {
      method: 'POST',
      body: JSON.stringify({ question, answer, role }),
    }),
};

/**
 * Phase 11: Notification service methods
 */
export const notificationService = {
  getNotifications: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    if (params.isRead !== undefined) qs.set('isRead', params.isRead);
    const queryString = qs.toString();
    return request(`/notifications${queryString ? `?${queryString}` : ''}`);
  },
  getUnreadCount: () => request('/notifications/unread-count'),
  markAsRead: (notificationId) =>
    request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }),
  markAllAsRead: () =>
    request('/notifications/read-all', {
      method: 'PATCH',
    }),
};

export default {
  authService,
  healthService,
  jobService,
  userService,
  applicationService,
  recruiterService,
  adminService,
  aiService,
  notificationService,
  request,
  BASE_URL,
};



