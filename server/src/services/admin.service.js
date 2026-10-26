import { isDbConnected } from '../config/db.js';
import User from '../models/user.model.js';
import Job from '../models/job.model.js';
import Application from '../models/application.model.js';
import AuditLog, { AUDIT_ACTIONS } from '../models/auditLog.model.js';
import { notificationService } from './notification.service.js';

export class AdminServiceError extends Error {
  constructor(message, statusCode = 400, code = 'ADMIN_ERROR') {
    super(message);
    this.name = 'AdminServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Isolated in-memory store for Phase 9 unit testing when MongoDB Atlas is disconnected
 */
class TestAdminStore {
  constructor() {
    this.enabled = false;
    this.users = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.auditLogs = [];
  }

  enable() {
    this.enabled = true;
    this.clear();
  }

  disable() {
    this.enabled = false;
    this.clear();
  }

  clear() {
    this.users.clear();
    this.jobs.clear();
    this.applications.clear();
    this.auditLogs = [];
  }

  seed({ users = [], jobs = [], applications = [], auditLogs = [] } = {}) {
    this.clear();
    for (const u of users) {
      this.users.set(String(u._id), JSON.parse(JSON.stringify(u)));
    }
    for (const j of jobs) {
      this.jobs.set(String(j._id), JSON.parse(JSON.stringify(j)));
    }
    for (const a of applications) {
      this.applications.set(String(a._id), JSON.parse(JSON.stringify(a)));
    }
    for (const log of auditLogs) {
      this.auditLogs.push(JSON.parse(JSON.stringify(log)));
    }
  }

  recordAudit(entry) {
    const log = {
      _id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(log);
    return log;
  }
}

export const testAdminStore = new TestAdminStore();

function checkDatabaseAccess() {
  if (!isDbConnected() && !testAdminStore.enabled) {
    throw new AdminServiceError(
      'Administrative operations require an active MongoDB connection.',
      503,
      'DATABASE_UNAVAILABLE'
    );
  }
}

function stripSensitiveUserFields(userObj) {
  if (!userObj) return null;
  const user = typeof userObj.toObject === 'function' ? userObj.toObject() : { ...userObj };
  delete user.passwordHash;
  delete user.password;
  delete user._plainPassword;
  delete user.__v;
  return user;
}

export const adminService = {
  /**
   * Retrieve platform-wide aggregate metrics and recent platform records
   */
  async getPlatformSummary() {
    checkDatabaseAccess();

    if (testAdminStore.enabled) {
      const users = Array.from(testAdminStore.users.values());
      const jobs = Array.from(testAdminStore.jobs.values());
      const apps = Array.from(testAdminStore.applications.values());

      const usersByRole = {
        jobseeker: users.filter((u) => u.role === 'jobseeker').length,
        recruiter: users.filter((u) => u.role === 'recruiter').length,
        admin: users.filter((u) => u.role === 'admin').length,
      };

      const employersAwaitingVerification = users.filter(
        (u) => u.role === 'recruiter' && (!u.isVerified || u.verificationRequest?.status === 'pending')
      ).length;

      const publishedJobs = jobs.filter((j) => j.status === 'published').length;
      const pendingModerationJobs = jobs.filter((j) => j.moderationStatus === 'pending').length;
      const flaggedJobs = jobs.filter((j) => j.moderationStatus === 'flagged').length;

      const recentlyRegisteredUsers = users
        .slice()
        .reverse()
        .slice(0, 5)
        .map(stripSensitiveUserFields);

      const recentJobs = jobs.slice().reverse().slice(0, 5);
      const recentActivity = testAdminStore.auditLogs.slice(0, 10);

      return {
        totalUsers: users.length,
        usersByRole,
        totalJobs: jobs.length,
        publishedJobs,
        pendingModerationJobs,
        flaggedJobs,
        totalApplications: apps.length,
        employersAwaitingVerification,
        recentlyRegisteredUsers,
        recentJobs,
        recentActivity,
      };
    }

    // Active MongoDB Queries
    const [
      totalUsers,
      jobseekerCount,
      recruiterCount,
      adminCount,
      totalJobs,
      publishedJobs,
      pendingModerationJobs,
      flaggedJobs,
      totalApplications,
      employersAwaitingVerification,
      recentlyRegisteredUsersRaw,
      recentJobs,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'jobseeker' }),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: 'admin' }),
      Job.countDocuments({}),
      Job.countDocuments({ status: 'published' }),
      Job.countDocuments({ moderationStatus: 'pending' }),
      Job.countDocuments({ moderationStatus: 'flagged' }),
      Application.countDocuments({}),
      User.countDocuments({
        role: 'recruiter',
        $or: [{ isVerified: false }, { 'verificationRequest.status': 'pending' }],
      }),
      User.find({}).sort({ createdAt: -1 }).limit(5).select('-passwordHash'),
      Job.find({}).sort({ createdAt: -1 }).limit(5),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(10),
    ]);

    return {
      totalUsers,
      usersByRole: {
        jobseeker: jobseekerCount,
        recruiter: recruiterCount,
        admin: adminCount,
      },
      totalJobs,
      publishedJobs,
      pendingModerationJobs,
      flaggedJobs,
      totalApplications,
      employersAwaitingVerification,
      recentlyRegisteredUsers: recentlyRegisteredUsersRaw.map(stripSensitiveUserFields),
      recentJobs,
      recentActivity,
    };
  },

  /**
   * List platform users with pagination, role filter, status filter, and keyword search
   */
  async getUsers({ page = 1, limit = 10, role, accountStatus, search } = {}) {
    checkDatabaseAccess();

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    if (testAdminStore.enabled) {
      let filtered = Array.from(testAdminStore.users.values());

      if (role) {
        filtered = filtered.filter((u) => u.role === role);
      }
      if (accountStatus) {
        filtered = filtered.filter((u) => u.accountStatus === accountStatus);
      }
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.recruiterProfile?.companyName?.toLowerCase().includes(query)
        );
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / pageLimit) || 1;
      const start = (currentPage - 1) * pageLimit;
      const users = filtered.slice(start, start + pageLimit).map(stripSensitiveUserFields);

      return {
        users,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          totalPages,
        },
      };
    }

    const query = {};
    if (role) query.role = role;
    if (accountStatus) query.accountStatus = accountStatus;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { 'recruiterProfile.companyName': regex },
      ];
    }

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / pageLimit) || 1;
    const usersRaw = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    return {
      users: usersRaw.map(stripSensitiveUserFields),
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages,
      },
    };
  },

  /**
   * Retrieve permitted details of a specific user
   */
  async getUserById(userId) {
    checkDatabaseAccess();

    if (testAdminStore.enabled) {
      const user = testAdminStore.users.get(String(userId));
      if (!user) {
        throw new AdminServiceError('User not found', 404, 'USER_NOT_FOUND');
      }
      return stripSensitiveUserFields(user);
    }

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AdminServiceError('User not found', 404, 'USER_NOT_FOUND');
    }
    return stripSensitiveUserFields(user);
  },

  /**
   * Suspend or reactivate user accounts with self-modification prevention and audit logging
   */
  async updateUserStatus(targetUserId, { accountStatus, reason }, adminUser) {
    checkDatabaseAccess();

    if (String(targetUserId) === String(adminUser._id)) {
      throw new AdminServiceError(
        'Administrators cannot suspend or change the status of their own account.',
        400,
        'SELF_MODIFICATION_PROHIBITED'
      );
    }

    if (testAdminStore.enabled) {
      const user = testAdminStore.users.get(String(targetUserId));
      if (!user) {
        throw new AdminServiceError('User not found', 404, 'USER_NOT_FOUND');
      }

      const prevStatus = user.accountStatus;
      user.accountStatus = accountStatus;
      user.statusReason = reason || '';
      user.updatedAt = new Date().toISOString();
      testAdminStore.users.set(String(targetUserId), user);

      const action = accountStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_REACTIVATED';
      testAdminStore.recordAudit({
        action,
        performedBy: adminUser._id,
        performedByName: adminUser.name || 'Administrator',
        performedByEmail: adminUser.email,
        targetType: 'User',
        targetId: String(targetUserId),
        targetName: user.name || user.email,
        details: {
          previousStatus: prevStatus,
          newStatus: accountStatus,
          reason: reason || 'Administrative decision',
        },
      });

      return stripSensitiveUserFields(user);
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new AdminServiceError('User not found', 404, 'USER_NOT_FOUND');
    }

    const prevStatus = user.accountStatus;
    user.accountStatus = accountStatus;
    await user.save();

    const action = accountStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_REACTIVATED';
    await AuditLog.create({
      action,
      performedBy: adminUser._id,
      performedByName: adminUser.name || 'Administrator',
      performedByEmail: adminUser.email,
      targetType: 'User',
      targetId: String(targetUserId),
      targetName: user.name || user.email,
      details: {
        previousStatus: prevStatus,
        newStatus: accountStatus,
        reason: reason || 'Administrative decision',
      },
    });

    return stripSensitiveUserFields(user);
  },

  /**
   * Retrieve list of employers awaiting verification or filtered by status
   */
  async getVerificationQueue({ page = 1, limit = 10, status = 'all' } = {}) {
    checkDatabaseAccess();

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    if (testAdminStore.enabled) {
      let employers = Array.from(testAdminStore.users.values()).filter(
        (u) => u.role === 'recruiter'
      );

      if (status === 'pending') {
        employers = employers.filter(
          (u) => !u.isVerified || u.verificationRequest?.status === 'pending'
        );
      } else if (status === 'approved') {
        employers = employers.filter((u) => u.isVerified === true);
      } else if (status === 'rejected') {
        employers = employers.filter((u) => u.verificationRequest?.status === 'rejected');
      }

      const total = employers.length;
      const totalPages = Math.ceil(total / pageLimit) || 1;
      const start = (currentPage - 1) * pageLimit;
      const items = employers.slice(start, start + pageLimit).map(stripSensitiveUserFields);

      return {
        employers: items,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          totalPages,
        },
      };
    }

    const query = { role: 'recruiter' };
    if (status === 'pending') {
      query.$or = [{ isVerified: false }, { 'verificationRequest.status': 'pending' }];
    } else if (status === 'approved') {
      query.isVerified = true;
    } else if (status === 'rejected') {
      query['verificationRequest.status'] = 'rejected';
    }

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / pageLimit) || 1;
    const raw = await User.find(query)
      .select('-passwordHash')
      .populate('verificationRequest.reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    return {
      employers: raw.map(stripSensitiveUserFields),
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages,
      },
    };
  },

  /**
   * Approve or reject employer verification request with audit trail
   */
  async reviewEmployerVerification(employerId, { status, reason }, adminUser) {
    checkDatabaseAccess();

    if (testAdminStore.enabled) {
      const employer = testAdminStore.users.get(String(employerId));
      if (!employer || employer.role !== 'recruiter') {
        throw new AdminServiceError('Employer account not found', 404, 'EMPLOYER_NOT_FOUND');
      }

      const isApproved = status === 'approved';
      employer.isVerified = isApproved;
      if (!employer.recruiterProfile) employer.recruiterProfile = {};
      employer.recruiterProfile.verifiedEmployer = isApproved;
      employer.verificationRequest = {
        status,
        reviewedBy: adminUser._id,
        reviewedAt: new Date().toISOString(),
        reason: reason || '',
      };
      testAdminStore.users.set(String(employerId), employer);

      const action = isApproved ? 'EMPLOYER_VERIFIED' : 'EMPLOYER_REJECTED';
      testAdminStore.recordAudit({
        action,
        performedBy: adminUser._id,
        performedByName: adminUser.name || 'Administrator',
        performedByEmail: adminUser.email,
        targetType: 'Employer',
        targetId: String(employerId),
        targetName: employer.recruiterProfile?.companyName || employer.name,
        details: {
          decision: status,
          reason: reason || (isApproved ? 'Documentation verified' : 'Incomplete documentation'),
        },
      });

      await notificationService.createNotification({
        recipient: String(employerId),
        type: isApproved ? 'EMPLOYER_VERIFIED' : 'EMPLOYER_REJECTED',
        title: isApproved ? 'Employer Verification Approved' : 'Employer Verification Update',
        message: isApproved
          ? 'Congratulations! Your employer account has been officially verified by LocalHire administrators.'
          : `Your employer verification was not approved: ${reason || 'Incomplete or unverified documentation.'}`,
        relatedEntityType: 'User',
        relatedEntityId: String(employerId),
      });

      return stripSensitiveUserFields(employer);
    }

    const employer = await User.findOne({ _id: employerId, role: 'recruiter' });
    if (!employer) {
      throw new AdminServiceError('Employer account not found', 404, 'EMPLOYER_NOT_FOUND');
    }

    const isApproved = status === 'approved';
    employer.isVerified = isApproved;
    if (!employer.recruiterProfile) employer.recruiterProfile = {};
    employer.recruiterProfile.verifiedEmployer = isApproved;
    employer.verificationRequest = {
      status,
      reviewedBy: adminUser._id,
      reviewedAt: new Date(),
      reason: reason || '',
    };
    await employer.save();

    const action = isApproved ? 'EMPLOYER_VERIFIED' : 'EMPLOYER_REJECTED';
    await AuditLog.create({
      action,
      performedBy: adminUser._id,
      performedByName: adminUser.name || 'Administrator',
      performedByEmail: adminUser.email,
      targetType: 'Employer',
      targetId: String(employerId),
      targetName: employer.recruiterProfile?.companyName || employer.name,
      details: {
        decision: status,
        reason: reason || (isApproved ? 'Documentation verified' : 'Incomplete documentation'),
      },
    });

    await notificationService.createNotification({
      recipient: String(employerId),
      type: isApproved ? 'EMPLOYER_VERIFIED' : 'EMPLOYER_REJECTED',
      title: isApproved ? 'Employer Verification Approved' : 'Employer Verification Update',
      message: isApproved
        ? 'Congratulations! Your employer account has been officially verified by LocalHire administrators.'
        : `Your employer verification was not approved: ${reason || 'Incomplete or unverified documentation.'}`,
      relatedEntityType: 'User',
      relatedEntityId: String(employerId),
    });

    return stripSensitiveUserFields(employer);
  },

  /**
   * Retrieve jobs for administrative review and moderation
   */
  async getJobsForModeration({
    page = 1,
    limit = 10,
    moderationStatus,
    status,
    search,
  } = {}) {
    checkDatabaseAccess();

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    if (testAdminStore.enabled) {
      let jobs = Array.from(testAdminStore.jobs.values());

      if (moderationStatus) {
        jobs = jobs.filter((j) => j.moderationStatus === moderationStatus);
      }
      if (status) {
        jobs = jobs.filter((j) => j.status === status);
      }
      if (search) {
        const query = search.toLowerCase();
        jobs = jobs.filter(
          (j) =>
            j.title?.toLowerCase().includes(query) ||
            j.company?.toLowerCase().includes(query) ||
            j.town?.toLowerCase().includes(query)
        );
      }

      const total = jobs.length;
      const totalPages = Math.ceil(total / pageLimit) || 1;
      const start = (currentPage - 1) * pageLimit;
      const items = jobs.slice(start, start + pageLimit);

      return {
        jobs: items,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          totalPages,
        },
      };
    }

    const query = {};
    if (moderationStatus) query.moderationStatus = moderationStatus;
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { company: regex }, { town: regex }];
    }

    const total = await Job.countDocuments(query);
    const totalPages = Math.ceil(total / pageLimit) || 1;
    const jobs = await Job.find(query)
      .populate('recruiterId', 'name email recruiterProfile.companyName')
      .populate('moderatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    return {
      jobs,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages,
      },
    };
  },

  /**
   * Apply moderation decisions to a job listing (approve, reject, flag, unpublish)
   */
  async moderateJob(jobId, { action, notes }, adminUser) {
    checkDatabaseAccess();

    let newModerationStatus = 'approved';
    let newStatus = 'published';
    let auditAction = 'JOB_APPROVED';

    if (action === 'approve') {
      newModerationStatus = 'approved';
      newStatus = 'published';
      auditAction = 'JOB_APPROVED';
    } else if (action === 'reject') {
      newModerationStatus = 'rejected';
      newStatus = 'closed';
      auditAction = 'JOB_REJECTED';
    } else if (action === 'flag') {
      newModerationStatus = 'flagged';
      newStatus = 'published';
      auditAction = 'JOB_FLAGGED';
    } else if (action === 'unpublish') {
      newModerationStatus = 'rejected';
      newStatus = 'draft';
      auditAction = 'JOB_UNPUBLISHED';
    }

    if (testAdminStore.enabled) {
      const job = testAdminStore.jobs.get(String(jobId));
      if (!job) {
        throw new AdminServiceError('Job not found', 404, 'JOB_NOT_FOUND');
      }

      const prevModerationStatus = job.moderationStatus || 'approved';
      job.moderationStatus = newModerationStatus;
      job.status = newStatus;
      job.moderationNotes = notes || '';
      job.moderatedBy = adminUser._id;
      job.moderatedAt = new Date().toISOString();
      testAdminStore.jobs.set(String(jobId), job);

      testAdminStore.recordAudit({
        action: auditAction,
        performedBy: adminUser._id,
        performedByName: adminUser.name || 'Administrator',
        performedByEmail: adminUser.email,
        targetType: 'Job',
        targetId: String(jobId),
        targetName: job.title,
        details: {
          previousStatus: prevModerationStatus,
          newModerationStatus,
          newPublicationStatus: newStatus,
          notes: notes || 'Administrative review completed',
        },
      });

      if (job.recruiterId) {
        const notifType = action === 'approve' ? 'JOB_APPROVED' : action === 'flag' ? 'JOB_FLAGGED' : 'JOB_REJECTED';
        const notifTitle = action === 'approve' ? 'Job Opening Approved' : action === 'flag' ? 'Job Opening Flagged' : 'Job Opening Moderation Update';
        const notifMessage = action === 'approve'
          ? `Your job vacancy "${job.title}" has been approved and published.`
          : action === 'flag'
          ? `Your job vacancy "${job.title}" has been flagged: ${notes || 'Needs administrative review.'}`
          : `Your job vacancy "${job.title}" was not approved: ${notes || 'Administrative review completed.'}`;

        await notificationService.createNotification({
          recipient: String(job.recruiterId._id || job.recruiterId),
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          relatedEntityType: 'Job',
          relatedEntityId: String(jobId),
        });
      }

      return job;
    }

    const job = await Job.findById(jobId);
    if (!job) {
      throw new AdminServiceError('Job not found', 404, 'JOB_NOT_FOUND');
    }

    const prevModerationStatus = job.moderationStatus || 'approved';
    job.moderationStatus = newModerationStatus;
    job.status = newStatus;
    job.moderationNotes = notes || '';
    job.moderatedBy = adminUser._id;
    job.moderatedAt = new Date();
    await job.save();

    await AuditLog.create({
      action: auditAction,
      performedBy: adminUser._id,
      performedByName: adminUser.name || 'Administrator',
      performedByEmail: adminUser.email,
      targetType: 'Job',
      targetId: String(jobId),
      targetName: job.title,
      details: {
        previousStatus: prevModerationStatus,
        newModerationStatus,
        newPublicationStatus: newStatus,
        notes: notes || 'Administrative review completed',
      },
    });

    if (job.recruiterId) {
      const notifType = action === 'approve' ? 'JOB_APPROVED' : action === 'flag' ? 'JOB_FLAGGED' : 'JOB_REJECTED';
      const notifTitle = action === 'approve' ? 'Job Opening Approved' : action === 'flag' ? 'Job Opening Flagged' : 'Job Opening Moderation Update';
      const notifMessage = action === 'approve'
        ? `Your job vacancy "${job.title}" has been approved and published.`
        : action === 'flag'
        ? `Your job vacancy "${job.title}" has been flagged: ${notes || 'Needs administrative review.'}`
        : `Your job vacancy "${job.title}" was not approved: ${notes || 'Administrative review completed.'}`;

      await notificationService.createNotification({
        recipient: String(job.recruiterId._id || job.recruiterId),
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        relatedEntityType: 'Job',
        relatedEntityId: String(jobId),
      });
    }

    return job;
  },

  /**
   * Retrieve platform administrative audit activity logs with pagination and filters
   */
  async getAuditLogs({ page = 1, limit = 15, action, targetType } = {}) {
    checkDatabaseAccess();

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));

    if (testAdminStore.enabled) {
      let logs = testAdminStore.auditLogs.slice();

      if (action) {
        logs = logs.filter((l) => l.action === action);
      }
      if (targetType) {
        logs = logs.filter((l) => l.targetType === targetType);
      }

      const total = logs.length;
      const totalPages = Math.ceil(total / pageLimit) || 1;
      const start = (currentPage - 1) * pageLimit;
      const items = logs.slice(start, start + pageLimit);

      return {
        logs: items,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          totalPages,
        },
      };
    }

    const query = {};
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;

    const total = await AuditLog.countDocuments(query);
    const totalPages = Math.ceil(total / pageLimit) || 1;
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    return {
      logs,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages,
      },
    };
  },
};

export default adminService;
