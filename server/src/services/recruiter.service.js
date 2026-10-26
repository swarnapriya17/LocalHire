import { isDbConnected } from '../config/db.js';
import User from '../models/user.model.js';
import Job from '../models/job.model.js';
import Application from '../models/application.model.js';
import { jobService } from './job.service.js';
import { testAppStore } from './application.service.js';

class RecruiterServiceError extends Error {
  constructor(message, statusCode = 400, code = 'RECRUITER_ERROR') {
    super(message);
    this.name = 'RecruiterServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Isolated in-memory test store used exclusively for unit testing
 */
class TestRecruiterStore {
  constructor() {
    this.enabled = false;
    this.users = new Map();
  }

  enable() {
    this.enabled = true;
    this.users.clear();
  }

  disable() {
    this.enabled = false;
    this.users.clear();
  }

  setUser(user) {
    this.users.set(String(user._id), { ...user });
  }

  getUser(userId) {
    return this.users.get(String(userId)) || null;
  }
}

export const testRecruiterStore = new TestRecruiterStore();

export const recruiterService = {
  /**
   * Retrieve recruiter dashboard summary metrics and company profile status
   */
  async getDashboardSummary(user) {
    if (!isDbConnected() && !testRecruiterStore.enabled) {
      throw new RecruiterServiceError(
        'Recruiter dashboard overview requires an active MongoDB connection.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const recruiterId = String(user._id);

    // In Test Mode
    if (testRecruiterStore.enabled) {
      const allJobs = jobService.getAllJobs ? jobService.getAllJobs() : (await jobService.getJobs({ limit: 100 })).jobs;
      const myJobs = allJobs.filter((j) => String(j.recruiterId) === recruiterId);

      const jobIds = myJobs.map((j) => String(j.id || j._id));
      const myApplications = testAppStore.find((a) => jobIds.includes(String(a.job)));

      const summary = {
        totalJobs: myJobs.length,
        publishedJobs: myJobs.filter((j) => j.status === 'published' || !j.status).length,
        closedJobs: myJobs.filter((j) => j.status === 'closed').length,
        draftJobs: myJobs.filter((j) => j.status === 'draft').length,
        totalApplicants: myApplications.length,
        appliedCount: myApplications.filter((a) => a.status === 'Applied').length,
        underReviewCount: myApplications.filter((a) => a.status === 'Under Review').length,
        shortlistedCount: myApplications.filter((a) => a.status === 'Shortlisted').length,
        interviewsScheduledCount: myApplications.filter((a) => a.status === 'Interview Scheduled').length,
        hiredCount: myApplications.filter((a) => a.status === 'Hired').length,
        rejectedCount: myApplications.filter((a) => a.status === 'Rejected').length,
      };

      const testUser = testRecruiterStore.getUser(recruiterId) || user;

      return {
        metrics: summary,
        company: testUser.recruiterProfile || {},
        isVerified: Boolean(testUser.isVerified),
        accountStatus: testUser.accountStatus || 'active',
        persistenceMode: 'test_memory',
      };
    }

    // In MongoDB Mode
    const myJobs = await Job.find({ recruiterId: user._id });
    const jobIds = myJobs.map((j) => j._id);

    const myApplications = await Application.find({ job: { $in: jobIds } });

    const summary = {
      totalJobs: myJobs.length,
      publishedJobs: myJobs.filter((j) => j.status === 'published').length,
      closedJobs: myJobs.filter((j) => j.status === 'closed').length,
      draftJobs: myJobs.filter((j) => j.status === 'draft').length,
      totalApplicants: myApplications.length,
      appliedCount: myApplications.filter((a) => a.status === 'Applied').length,
      underReviewCount: myApplications.filter((a) => a.status === 'Under Review').length,
      shortlistedCount: myApplications.filter((a) => a.status === 'Shortlisted').length,
      interviewsScheduledCount: myApplications.filter((a) => a.status === 'Interview Scheduled').length,
      hiredCount: myApplications.filter((a) => a.status === 'Hired').length,
      rejectedCount: myApplications.filter((a) => a.status === 'Rejected').length,
    };

    const dbUser = await User.findById(user._id).select('-passwordHash');

    return {
      metrics: summary,
      company: dbUser?.recruiterProfile || {},
      isVerified: Boolean(dbUser?.isVerified),
      accountStatus: dbUser?.accountStatus || 'active',
      persistenceMode: 'mongodb',
    };
  },

  /**
   * Retrieve company profile for the authenticated recruiter
   */
  async getCompanyProfile(user) {
    if (!isDbConnected() && !testRecruiterStore.enabled) {
      throw new RecruiterServiceError(
        'Retrieving employer profile requires an active MongoDB connection.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const recruiterId = String(user._id);

    if (testRecruiterStore.enabled) {
      const u = testRecruiterStore.getUser(recruiterId) || user;
      return {
        name: u.name,
        email: u.email,
        role: u.role,
        isVerified: Boolean(u.isVerified),
        accountStatus: u.accountStatus || 'active',
        recruiterProfile: u.recruiterProfile || {},
        persistenceMode: 'test_memory',
      };
    }

    const dbUser = await User.findById(user._id).select('-passwordHash');
    if (!dbUser) {
      throw new RecruiterServiceError('Recruiter user account not found.', 404, 'USER_NOT_FOUND');
    }

    return {
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      isVerified: Boolean(dbUser.isVerified),
      accountStatus: dbUser.accountStatus,
      recruiterProfile: dbUser.recruiterProfile || {},
      persistenceMode: 'mongodb',
    };
  },

  /**
   * Update company profile for the authenticated recruiter
   */
  async updateCompanyProfile(updateData, user) {
    if (!isDbConnected() && !testRecruiterStore.enabled) {
      throw new RecruiterServiceError(
        'Updating company profile requires an active MongoDB connection.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const recruiterId = String(user._id);

    if (testRecruiterStore.enabled) {
      const existing = testRecruiterStore.getUser(recruiterId) || { ...user };
      if (updateData.name) existing.name = updateData.name;
      existing.recruiterProfile = {
        ...(existing.recruiterProfile || {}),
        ...(updateData.recruiterProfile || {}),
      };
      testRecruiterStore.setUser(existing);

      return {
        name: existing.name,
        email: existing.email,
        isVerified: Boolean(existing.isVerified),
        accountStatus: existing.accountStatus || 'active',
        recruiterProfile: existing.recruiterProfile,
        persistenceMode: 'test_memory',
      };
    }

    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      throw new RecruiterServiceError('Recruiter user account not found.', 404, 'USER_NOT_FOUND');
    }

    if (updateData.name) {
      dbUser.name = updateData.name;
    }

    if (updateData.recruiterProfile) {
      dbUser.recruiterProfile = {
        ...(dbUser.recruiterProfile ? dbUser.recruiterProfile.toObject() : {}),
        ...updateData.recruiterProfile,
      };
    }

    await dbUser.save();

    return {
      name: dbUser.name,
      email: dbUser.email,
      isVerified: Boolean(dbUser.isVerified),
      accountStatus: dbUser.accountStatus,
      recruiterProfile: dbUser.recruiterProfile,
      persistenceMode: 'mongodb',
    };
  },

  /**
   * Retrieve detailed recruitment analytics for the recruiter's jobs
   */
  async getRecruiterAnalytics(user) {
    if (!isDbConnected() && !testRecruiterStore.enabled) {
      throw new RecruiterServiceError(
        'Recruiter analytics requires an active MongoDB connection.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const recruiterId = String(user._id);

    let myJobs = [];
    let myApplications = [];

    if (testRecruiterStore.enabled) {
      const allJobs = jobService.getAllJobs ? jobService.getAllJobs() : (await jobService.getJobs({ limit: 100 })).jobs;
      myJobs = allJobs.filter((j) => String(j.recruiterId) === recruiterId);
      const jobIds = myJobs.map((j) => String(j.id || j._id));
      myApplications = testAppStore.find((a) => jobIds.includes(String(a.job)));
    } else {
      myJobs = await Job.find({ recruiterId: user._id });
      const jobIds = myJobs.map((j) => j._id);
      myApplications = await Application.find({ job: { $in: jobIds } })
        .populate('job', 'title town')
        .populate('applicant', 'name email jobseekerProfile.headline jobseekerProfile.location')
        .sort({ createdAt: -1 });
    }

    // 1. Applications per job
    const jobsAnalytics = myJobs.map((j) => {
      const jId = String(j.id || j._id);
      const jobApps = myApplications.filter((a) => String(a.job?._id || a.job) === jId);
      return {
        jobId: jId,
        title: j.title,
        town: j.town,
        status: j.status || 'published',
        applicantCount: jobApps.length,
        shortlistedCount: jobApps.filter((a) => a.status === 'Shortlisted').length,
        interviewCount: jobApps.filter((a) => a.status === 'Interview Scheduled').length,
        hiredCount: jobApps.filter((a) => a.status === 'Hired').length,
      };
    });

    // 2. Status distribution
    const statusDistribution = {
      Applied: myApplications.filter((a) => a.status === 'Applied').length,
      'Under Review': myApplications.filter((a) => a.status === 'Under Review').length,
      Shortlisted: myApplications.filter((a) => a.status === 'Shortlisted').length,
      'Interview Scheduled': myApplications.filter((a) => a.status === 'Interview Scheduled').length,
      Hired: myApplications.filter((a) => a.status === 'Hired').length,
      Rejected: myApplications.filter((a) => a.status === 'Rejected').length,
    };

    // 3. Conversion rates
    const total = myApplications.length;
    const shortlisted = statusDistribution.Shortlisted + statusDistribution['Interview Scheduled'] + statusDistribution.Hired;
    const interviews = statusDistribution['Interview Scheduled'] + statusDistribution.Hired;
    const hired = statusDistribution.Hired;

    const conversionRates = {
      shortlistRate: total > 0 ? Math.round((shortlisted / total) * 100) : 0,
      interviewRate: total > 0 ? Math.round((interviews / total) * 100) : 0,
      hireRate: total > 0 ? Math.round((hired / total) * 100) : 0,
    };

    // 4. Recent applications
    const recentApplications = myApplications.slice(0, 8).map((a) => ({
      id: a.id || a._id,
      candidateName: a.applicant?.name || 'Applicant',
      candidateHeadline: a.applicant?.jobseekerProfile?.headline || 'Job Seeker',
      candidateLocation: a.applicant?.jobseekerProfile?.location || 'West Godavari',
      jobTitle: a.job?.title || 'Job Opening',
      status: a.status,
      appliedAt: a.createdAt || a.submissionTimestamp || new Date(),
    }));

    return {
      totalJobs: myJobs.length,
      totalApplicants: total,
      jobsAnalytics,
      statusDistribution,
      conversionRates,
      recentApplications,
      persistenceMode: testRecruiterStore.enabled ? 'test_memory' : 'mongodb',
    };
  },

  /**
   * Retrieve all scheduled interviews for the recruiter's openings
   */
  async getScheduledInterviews(user) {
    if (!isDbConnected() && !testRecruiterStore.enabled) {
      throw new RecruiterServiceError(
        'Retrieving scheduled interviews requires an active MongoDB connection.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    const recruiterId = String(user._id);

    if (testRecruiterStore.enabled) {
      const allJobs = jobService.getAllJobs ? jobService.getAllJobs() : (await jobService.getJobs({ limit: 100 })).jobs;
      const myJobs = allJobs.filter((j) => String(j.recruiterId) === recruiterId);
      const jobIds = myJobs.map((j) => String(j.id || j._id));

      const interviewApps = testAppStore.find(
        (a) => jobIds.includes(String(a.job)) && a.status === 'Interview Scheduled'
      );

      const formatted = interviewApps.map((a) => {
        const j = myJobs.find((job) => String(job.id || job._id) === String(a.job));
        return {
          id: a.id || a._id,
          job: {
            id: j?.id || j?._id,
            title: j?.title || 'Open Position',
            company: j?.company || 'Local Employer',
            town: j?.town || 'West Godavari',
          },
          candidate: {
            id: a.applicant,
            name: 'Candidate',
            email: 'candidate@localhire.dev',
          },
          interviewDetails: a.interviewDetails || {},
          status: a.status,
          updatedAt: a.updatedAt || new Date(),
        };
      });

      return {
        interviews: formatted,
        count: formatted.length,
        persistenceMode: 'test_memory',
      };
    }

    const myJobs = await Job.find({ recruiterId: user._id });
    const jobIds = myJobs.map((j) => j._id);

    const interviewApps = await Application.find({
      job: { $in: jobIds },
      status: 'Interview Scheduled',
    })
      .populate('job', 'title company town')
      .populate('applicant', 'name email jobseekerProfile.phone jobseekerProfile.headline jobseekerProfile.location')
      .sort({ 'interviewDetails.interviewDate': 1, updatedAt: -1 });

    const formatted = interviewApps.map((a) => ({
      id: a.id || a._id,
      job: a.job,
      candidate: a.applicant,
      interviewDetails: a.interviewDetails,
      status: a.status,
      updatedAt: a.updatedAt,
    }));

    return {
      interviews: formatted,
      count: formatted.length,
      persistenceMode: 'mongodb',
    };
  },
};

export default recruiterService;
