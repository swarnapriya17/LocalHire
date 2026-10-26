import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { signToken } from '../utils/token.js';
import {
  validateUserStatusUpdate,
  validateEmployerVerification,
  validateJobModeration,
} from '../validators/admin.validator.js';
import { adminService, testAdminStore } from '../services/admin.service.js';

let testServer;
let BASE_URL = 'http://localhost:5000';

const adminUser = {
  _id: 'admin-phase9-test-001',
  email: 'admin.lead@localhire.dev',
  role: 'admin',
  name: 'Platform Administrator',
};

const recruiterUser = {
  _id: 'recruiter-phase9-test-002',
  email: 'hr.delta@localhire.dev',
  role: 'recruiter',
  name: 'Delta Recruiter',
  isVerified: false,
  recruiterProfile: {
    companyName: 'Delta Software Bhimavaram',
    town: 'Bhimavaram',
    verifiedEmployer: false,
  },
  verificationRequest: {
    status: 'pending',
    reason: '',
  },
};

const jobseekerUser = {
  _id: 'seeker-phase9-test-003',
  email: 'candidate.eluru@localhire.dev',
  role: 'jobseeker',
  name: 'P. Sai Kumar',
  accountStatus: 'active',
};

const mockJob = {
  _id: 'job-phase9-test-101',
  title: 'Full Stack React Developer',
  company: 'Delta Software Bhimavaram',
  recruiterId: recruiterUser._id,
  town: 'Bhimavaram',
  category: 'it-software',
  employmentType: 'Full-time',
  status: 'published',
  moderationStatus: 'pending',
  createdAt: new Date().toISOString(),
};

const adminToken = signToken(adminUser);
const recruiterToken = signToken(recruiterUser);
const jobseekerToken = signToken(jobseekerUser);

describe('Phase 9: Admin Dashboard & Trust Management Tests', () => {
  before(async () => {
    await new Promise((resolve) => {
      testServer = app.listen(0, () => {
        const port = testServer.address().port;
        BASE_URL = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  });

  beforeEach(() => {
    testAdminStore.enable();
    testAdminStore.seed({
      users: [adminUser, recruiterUser, jobseekerUser],
      jobs: [mockJob],
      applications: [],
      auditLogs: [],
    });
  });

  afterEach(() => {
    testAdminStore.disable();
  });

  describe('Administrative Validation & Payload Protection Rules', () => {
    test('validateUserStatusUpdate accepts active and suspended', () => {
      const res1 = validateUserStatusUpdate({ accountStatus: 'suspended', reason: 'Violation of policy' });
      assert.equal(res1.isValid, true);
      assert.equal(res1.sanitized.accountStatus, 'suspended');

      const res2 = validateUserStatusUpdate({ accountStatus: 'active' });
      assert.equal(res2.isValid, true);
      assert.equal(res2.sanitized.accountStatus, 'active');
    });

    test('validateUserStatusUpdate strictly rejects tampering with role or credentials', () => {
      const res = validateUserStatusUpdate({
        accountStatus: 'active',
        role: 'admin',
        password: 'hackedPassword123',
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('role')));
      assert.ok(res.errors.some((e) => e.includes('password')));
    });

    test('validateEmployerVerification accepts approved and rejected', () => {
      const res1 = validateEmployerVerification({ status: 'approved' });
      assert.equal(res1.isValid, true);
      assert.equal(res1.sanitized.status, 'approved');

      const res2 = validateEmployerVerification({ status: 'rejected', reason: 'Incomplete business registration' });
      assert.equal(res2.isValid, true);
      assert.equal(res2.sanitized.status, 'rejected');

      const res3 = validateEmployerVerification({ status: 'unknown' });
      assert.equal(res3.isValid, false);
    });

    test('validateJobModeration accepts valid moderation actions', () => {
      const validActions = ['approve', 'reject', 'flag', 'unpublish'];
      for (const action of validActions) {
        const res = validateJobModeration({ action, notes: 'Verified compliance' });
        assert.equal(res.isValid, true);
        assert.equal(res.sanitized.action, action);
      }

      const invalid = validateJobModeration({ action: 'delete_forever' });
      assert.equal(invalid.isValid, false);
    });
  });

  describe('Admin Service Logic & State Transitions', () => {
    test('getPlatformSummary computes accurate platform metrics', async () => {
      const summary = await adminService.getPlatformSummary();
      assert.equal(summary.totalUsers, 3);
      assert.equal(summary.usersByRole.admin, 1);
      assert.equal(summary.usersByRole.recruiter, 1);
      assert.equal(summary.usersByRole.jobseeker, 1);
      assert.equal(summary.totalJobs, 1);
      assert.equal(summary.pendingModerationJobs, 1);
      assert.equal(summary.employersAwaitingVerification, 1);
      assert.ok(Array.isArray(summary.recentlyRegisteredUsers));
    });

    test('getUsers supports pagination, role filtering, and keyword search', async () => {
      const allUsers = await adminService.getUsers({ page: 1, limit: 10 });
      assert.equal(allUsers.users.length, 3);
      assert.equal(allUsers.pagination.total, 3);

      const recruitersOnly = await adminService.getUsers({ role: 'recruiter' });
      assert.equal(recruitersOnly.users.length, 1);
      assert.equal(recruitersOnly.users[0].role, 'recruiter');

      const searchResult = await adminService.getUsers({ search: 'eluru' });
      assert.equal(searchResult.users.length, 1);
      assert.equal(searchResult.users[0].email, 'candidate.eluru@localhire.dev');
    });

    test('updateUserStatus suspends and reactivates accounts with audit trail', async () => {
      const suspended = await adminService.updateUserStatus(
        jobseekerUser._id,
        { accountStatus: 'suspended', reason: 'Abuse report verified' },
        adminUser
      );
      assert.equal(suspended.accountStatus, 'suspended');

      const logs = await adminService.getAuditLogs();
      assert.equal(logs.logs.length, 1);
      assert.equal(logs.logs[0].action, 'USER_SUSPENDED');
      assert.equal(logs.logs[0].targetId, jobseekerUser._id);

      const reactivated = await adminService.updateUserStatus(
        jobseekerUser._id,
        { accountStatus: 'active', reason: 'Review resolved' },
        adminUser
      );
      assert.equal(reactivated.accountStatus, 'active');
      assert.equal(testAdminStore.auditLogs.length, 2);
    });

    test('updateUserStatus strictly prohibits admin self-suspension', async () => {
      await assert.rejects(
        () =>
          adminService.updateUserStatus(
            adminUser._id,
            { accountStatus: 'suspended' },
            adminUser
          ),
        {
          code: 'SELF_MODIFICATION_PROHIBITED',
          statusCode: 400,
        }
      );
    });

    test('reviewEmployerVerification approves recruiter and records audit', async () => {
      const approved = await adminService.reviewEmployerVerification(
        recruiterUser._id,
        { status: 'approved', reason: 'GST and MCA registration verified' },
        adminUser
      );
      assert.equal(approved.isVerified, true);
      assert.equal(approved.recruiterProfile.verifiedEmployer, true);
      assert.equal(approved.verificationRequest.status, 'approved');

      const audit = testAdminStore.auditLogs.find((l) => l.action === 'EMPLOYER_VERIFIED');
      assert.ok(audit);
      assert.equal(audit.targetId, recruiterUser._id);
    });

    test('moderateJob updates moderation status and records audit trail', async () => {
      const approvedJob = await adminService.moderateJob(
        mockJob._id,
        { action: 'approve', notes: 'Legitimate opening confirmed' },
        adminUser
      );
      assert.equal(approvedJob.moderationStatus, 'approved');
      assert.equal(approvedJob.status, 'published');

      const flaggedJob = await adminService.moderateJob(
        mockJob._id,
        { action: 'flag', notes: 'Suspicious compensation claim' },
        adminUser
      );
      assert.equal(flaggedJob.moderationStatus, 'flagged');

      const rejectedJob = await adminService.moderateJob(
        mockJob._id,
        { action: 'reject', notes: 'Spam listing' },
        adminUser
      );
      assert.equal(rejectedJob.moderationStatus, 'rejected');
      assert.equal(rejectedJob.status, 'closed');
    });
  });

  describe('Admin HTTP API Security & Authorization Enforcement', () => {
    test('GET /api/admin/summary strictly rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/summary`);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHENTICATED');
    });

    test('GET /api/admin/summary strictly rejects jobseeker role with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/summary`, {
        headers: { Authorization: `Bearer ${jobseekerToken}` },
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'FORBIDDEN_ROLE');
    });

    test('GET /api/admin/summary strictly rejects recruiter role with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/summary`, {
        headers: { Authorization: `Bearer ${recruiterToken}` },
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'FORBIDDEN_ROLE');
    });

    test('GET /api/admin/summary succeeds for authorized admin and excludes secrets', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.totalUsers >= 3);
      assert.equal(body.data.usersByRole.admin, 1);

      // Verify zero sensitive credentials in response
      const rawString = JSON.stringify(body);
      assert.equal(rawString.includes('passwordHash'), false);
      assert.equal(rawString.includes('plainPassword'), false);
    });

    test('PUT /api/admin/users/:id/status rejects privilege tampering with 400', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/users/${jobseekerUser._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          accountStatus: 'active',
          role: 'admin', // Illegal role escalation attempt
        }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });

    test('PUT /api/admin/users/:id/status blocks admin self-suspension with 400', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/users/${adminUser._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          accountStatus: 'suspended',
        }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'SELF_MODIFICATION_PROHIBITED');
    });

    test('PUT /api/admin/employers/:id/verification reviews verification and logs audit', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/employers/${recruiterUser._id}/verification`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'approved',
          reason: 'Verified local business in Bhimavaram',
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.isVerified, true);
      assert.equal(body.data.recruiterProfile.verifiedEmployer, true);
    });

    test('PUT /api/admin/jobs/:id/moderate applies moderation decision with 200', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/jobs/${mockJob._id}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          action: 'approve',
          notes: 'Standard opening confirmed',
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.moderationStatus, 'approved');
    });

    test('GET /api/admin/audit-logs retrieves platform activity history', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
    });

    test('GET /api/admin/summary returns 503 DATABASE_UNAVAILABLE when disconnected', async () => {
      testAdminStore.disable(); // Simulate disconnected database with no test double
      const res = await fetch(`${BASE_URL}/api/admin/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'DATABASE_UNAVAILABLE');
    });
  });
});
