import { isDbConnected } from '../config/db.js';
import Application from '../models/application.model.js';
import { jobService } from './job.service.js';
import { notificationService } from './notification.service.js';

/**
 * Custom error with HTTP status code and error code
 */
class ApplicationError extends Error {
  constructor(message, statusCode = 400, code = 'APPLICATION_ERROR') {
    super(message);
    this.name = 'ApplicationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Isolated in-memory test store used exclusively for unit testing
 * (Never exposed across arbitrary user requests in production)
 */
class TestApplicationStore {
  constructor() {
    this.applications = [];
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
    this.applications = [];
  }

  disable() {
    this.enabled = false;
    this.applications = [];
  }

  find(predicate) {
    return this.applications.filter(predicate);
  }

  findOne(predicate) {
    return this.applications.find(predicate) || null;
  }

  findById(id) {
    return this.applications.find((a) => String(a.id || a._id) === String(id)) || null;
  }

  save(app) {
    const existingIndex = this.applications.findIndex((a) => String(a.id || a._id) === String(app.id || app._id));
    if (existingIndex >= 0) {
      this.applications[existingIndex] = { ...app };
      return this.applications[existingIndex];
    }
    this.applications.unshift({ ...app });
    return app;
  }
}

export const testAppStore = new TestApplicationStore();

export const applicationService = {
  /**
   * Submit an application for an existing published job (Job Seekers only)
   */
  async submitApplication(payload, user) {
    if (!isDbConnected() && !testAppStore.enabled) {
      throw new ApplicationError(
        'Submitting job applications requires an active MongoDB connection.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    // 1. Verify job exists
    const jobResult = await jobService.getJobById(payload.jobId);
    if (!jobResult || !jobResult.job) {
      throw new ApplicationError(
        'Job vacancy not found. It may have expired or been removed.',
        404,
        'JOB_NOT_FOUND'
      );
    }

    const job = jobResult.job;

    // 2. Verify job is published
    if (job.status && job.status !== 'published') {
      throw new ApplicationError(
        'This job vacancy is currently closed or in draft mode and cannot accept applications.',
        400,
        'JOB_NOT_PUBLISHED'
      );
    }

    const applicantId = String(user._id);
    const jobId = String(job.id || job._id);

    // 3. Prevent duplicate applications
    if (testAppStore.enabled) {
      const existing = testAppStore.findOne(
        (a) => String(a.applicant) === applicantId && String(a.job) === jobId
      );
      if (existing) {
        throw new ApplicationError(
          'You have already applied for this position. Duplicate applications are not allowed.',
          409,
          'DUPLICATE_APPLICATION'
        );
      }

      const mockApp = {
        _id: `app-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        id: `app-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        job: jobId,
        applicant: applicantId,
        status: 'Applied',
        coverLetter: payload.coverLetter || '',
        resumeUrl: payload.resumeUrl || user.jobseekerProfile?.resumeUrl || '',
        recruiterNotes: '',
        interviewDetails: {},
        statusHistory: [
          {
            status: 'Applied',
            changedBy: applicantId,
            changedAt: new Date(),
            notes: 'Initial application submitted.',
          },
        ],
        submissionTimestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      testAppStore.save(mockApp);

      // Notify recruiter asynchronously
      if (job.recruiterId) {
        await notificationService.createNotification({
          recipient: String(job.recruiterId),
          type: 'APPLICATION_SUBMITTED',
          title: 'New Job Application Received',
          message: `New application submitted by ${user.name || 'a candidate'} for position "${job.title}".`,
          relatedEntityType: 'Application',
          relatedEntityId: mockApp.id,
          idempotencyKey: `app-sub-${jobId}-${applicantId}`,
        });
      }

      return { application: mockApp, persistenceMode: 'test_memory' };
    }

    // In MongoDB:
    const existing = await Application.findOne({ applicant: user._id, job: job._id });
    if (existing) {
      throw new ApplicationError(
        'You have already applied for this position. Duplicate applications are not allowed.',
        409,
        'DUPLICATE_APPLICATION'
      );
    }

    const application = await Application.create({
      job: job._id,
      applicant: user._id,
      status: 'Applied',
      coverLetter: payload.coverLetter || '',
      resumeUrl: payload.resumeUrl || user.jobseekerProfile?.resumeUrl || '',
      statusHistory: [
        {
          status: 'Applied',
          changedBy: user._id,
          changedAt: new Date(),
          notes: 'Initial application submitted.',
        },
      ],
    });

    // Notify recruiter asynchronously
    if (job.recruiterId) {
      await notificationService.createNotification({
        recipient: String(job.recruiterId),
        type: 'APPLICATION_SUBMITTED',
        title: 'New Job Application Received',
        message: `New application submitted by ${user.name || 'a candidate'} for position "${job.title}".`,
        relatedEntityType: 'Application',
        relatedEntityId: String(application._id),
        idempotencyKey: `app-sub-${jobId}-${applicantId}`,
      });
    }

    return {
      application: application.toJSON(),
      persistenceMode: 'mongodb',
    };
  },

  /**
   * Retrieve the authenticated job seeker's application history
   */
  async getMyApplications(user) {
    if (!isDbConnected() && !testAppStore.enabled) {
      throw new ApplicationError(
        'Retrieving your application history requires an active MongoDB connection.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    if (testAppStore.enabled) {
      const apps = testAppStore.find((a) => String(a.applicant) === String(user._id));
      return {
        applications: apps,
        count: apps.length,
        persistenceMode: 'test_memory',
      };
    }

    const applications = await Application.find({ applicant: user._id })
      .populate('job', 'title company town employmentType workMode status category salary')
      .sort({ createdAt: -1 });

    return {
      applications: applications.map((a) => a.toJSON()),
      count: applications.length,
      persistenceMode: 'mongodb',
    };
  },

  /**
   * Retrieve applications for a job owned by the authenticated recruiter
   */
  async getJobApplications(jobId, user) {
    if (!isDbConnected() && !testAppStore.enabled) {
      throw new ApplicationError(
        'Retrieving candidate applications requires an active MongoDB connection.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    // Verify job exists
    const jobResult = await jobService.getJobById(jobId);
    if (!jobResult || !jobResult.job) {
      throw new ApplicationError(
        'Job vacancy not found.',
        404,
        'JOB_NOT_FOUND'
      );
    }

    const job = jobResult.job;

    // Verify ownership: recruiter must own the job or be admin
    const isOwner = String(job.recruiterId) === String(user._id);
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ApplicationError(
        'Access denied. You can only view applications for job openings you posted.',
        403,
        'FORBIDDEN'
      );
    }

    if (testAppStore.enabled) {
      const apps = testAppStore.find((a) => String(a.job) === String(jobId));
      return {
        job: { id: job.id || job._id, title: job.title, company: job.company },
        applications: apps,
        count: apps.length,
        persistenceMode: 'test_memory',
      };
    }

    const applications = await Application.find({ job: job._id })
      .populate(
        'applicant',
        'name email jobseekerProfile.phone jobseekerProfile.headline jobseekerProfile.location jobseekerProfile.skills jobseekerProfile.education jobseekerProfile.isFresher jobseekerProfile.workExperience jobseekerProfile.projects jobseekerProfile.certifications'
      )
      .sort({ createdAt: -1 });

    return {
      job: { id: job.id || job._id, title: job.title, company: job.company },
      applications: applications.map((a) => a.toJSON()),
      count: applications.length,
      persistenceMode: 'mongodb',
    };
  },

  /**
   * Retrieve an application by ID if requester is authorized (applicant, job's recruiter, or admin)
   */
  async getApplicationById(applicationId, user) {
    if (!isDbConnected() && !testAppStore.enabled) {
      throw new ApplicationError(
        'Retrieving application details requires an active MongoDB connection.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    let application = null;
    let job = null;

    if (testAppStore.enabled) {
      application = testAppStore.findById(applicationId);
      if (!application) {
        throw new ApplicationError('Application record not found.', 404, 'APPLICATION_NOT_FOUND');
      }
      const jobRes = await jobService.getJobById(application.job);
      job = jobRes ? jobRes.job : null;
    } else {
      application = await Application.findById(applicationId)
        .populate('job')
        .populate(
          'applicant',
          'name email jobseekerProfile.phone jobseekerProfile.headline jobseekerProfile.location jobseekerProfile.skills jobseekerProfile.education jobseekerProfile.isFresher jobseekerProfile.workExperience jobseekerProfile.projects'
        );

      if (!application) {
        throw new ApplicationError('Application record not found.', 404, 'APPLICATION_NOT_FOUND');
      }
      job = application.job;
    }

    // Ownership check: applicant, job recruiter, or admin
    const isApplicant = String(application.applicant._id || application.applicant) === String(user._id);
    const isRecruiter = job && String(job.recruiterId) === String(user._id);
    const isAdmin = user.role === 'admin';

    if (!isApplicant && !isRecruiter && !isAdmin) {
      throw new ApplicationError(
        'Access denied. You are not authorized to view this candidate application.',
        403,
        'FORBIDDEN'
      );
    }

    return {
      application: application.toJSON ? application.toJSON() : application,
      isApplicant,
      isRecruiter,
      persistenceMode: testAppStore.enabled ? 'test_memory' : 'mongodb',
    };
  },

  /**
   * Update application status and interview details (Recruiter or Admin only)
   */
  async updateApplicationStatus(applicationId, updateData, user) {
    if (!isDbConnected() && !testAppStore.enabled) {
      throw new ApplicationError(
        'Updating application status requires an active MongoDB connection.',
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    // Role check: candidates can never update status
    if (user.role === 'jobseeker') {
      throw new ApplicationError(
        'Access denied. Candidates cannot update application status.',
        403,
        'FORBIDDEN'
      );
    }

    let application = null;
    let job = null;

    if (testAppStore.enabled) {
      application = testAppStore.findById(applicationId);
      if (!application) {
        throw new ApplicationError('Application record not found.', 404, 'APPLICATION_NOT_FOUND');
      }
      const jobRes = await jobService.getJobById(application.job);
      job = jobRes ? jobRes.job : null;
    } else {
      application = await Application.findById(applicationId).populate('job');
      if (!application) {
        throw new ApplicationError('Application record not found.', 404, 'APPLICATION_NOT_FOUND');
      }
      job = application.job;
    }

    // Verify recruiter owns the job or is admin
    const isOwner = job && String(job.recruiterId) === String(user._id);
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ApplicationError(
        'Access denied. You can only update application status for job openings you posted.',
        403,
        'FORBIDDEN'
      );
    }

    const { status, notes, interviewDetails } = updateData;
    const isInterview = status === 'Interview Scheduled';
    const notifType = isInterview ? 'INTERVIEW_SCHEDULED' : 'APPLICATION_STATUS_UPDATED';
    const notifTitle = isInterview ? 'Interview Scheduled' : 'Application Status Updated';
    const jobTitle = job?.title || 'the position';
    const notifMessage = isInterview
      ? `An interview has been scheduled for your application to "${jobTitle}".`
      : `Your application for "${jobTitle}" has been updated to "${status}".`;

    if (testAppStore.enabled) {
      application.status = status;
      if (notes) application.recruiterNotes = notes;
      if (interviewDetails) application.interviewDetails = interviewDetails;

      application.statusHistory.push({
        status,
        changedBy: String(user._id),
        changedAt: new Date(),
        notes: notes || '',
      });
      application.updatedAt = new Date();

      testAppStore.save(application);

      // Notify candidate
      const candidateId = String(application.applicant?._id || application.applicant);
      if (candidateId) {
        await notificationService.createNotification({
          recipient: candidateId,
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          relatedEntityType: 'Application',
          relatedEntityId: String(application.id || application._id),
        });
      }

      return { application, persistenceMode: 'test_memory' };
    }

    application.status = status;
    if (notes) application.recruiterNotes = notes;
    if (interviewDetails) application.interviewDetails = interviewDetails;

    application.statusHistory.push({
      status,
      changedBy: user._id,
      changedAt: new Date(),
      notes: notes || '',
    });

    await application.save();

    // Notify candidate
    const candidateId = String(application.applicant?._id || application.applicant);
    if (candidateId) {
      await notificationService.createNotification({
        recipient: candidateId,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        relatedEntityType: 'Application',
        relatedEntityId: String(application._id),
      });
    }

    return {
      application: application.toJSON(),
      persistenceMode: 'mongodb',
    };
  },
};

export default applicationService;
