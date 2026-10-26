import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { signToken } from '../utils/token.js';
import {
  validateNotificationQuery,
  validateNotificationId,
} from '../validators/notification.validator.js';
import {
  notificationService,
  testNotificationStore,
} from '../services/notification.service.js';
import { applicationService, testAppStore } from '../services/application.service.js';
import { adminService, testAdminStore } from '../services/admin.service.js';
import { jobService } from '../services/job.service.js';

let testServer;
let BASE_URL = 'http://localhost:5000';

const userA = {
  _id: 'user-phase11-notif-001',
  email: 'ramesh.bhimavaram@localhire.dev',
  role: 'jobseeker',
  name: 'Ramesh Varma',
};

const userB = {
  _id: 'user-phase11-notif-002',
  email: 'suresh.eluru@localhire.dev',
  role: 'jobseeker',
  name: 'Suresh Kumar',
};

const recruiterUser = {
  _id: 'recruiter-phase11-notif-003',
  email: 'hr.godavari@localhire.dev',
  role: 'recruiter',
  name: 'Godavari Tech HR',
};

const adminUser = {
  _id: 'admin-phase11-notif-004',
  email: 'admin.lead@localhire.dev',
  role: 'admin',
  name: 'Lead Administrator',
};

const tokenA = signToken(userA);
const tokenB = signToken(userB);
const recruiterToken = signToken(recruiterUser);
const adminToken = signToken(adminUser);

describe('Phase 11: Notification System & Workflow Triggers', () => {
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
    testNotificationStore.enable();
    testAppStore.enable();
    testAdminStore.enable();
  });

  afterEach(() => {
    testNotificationStore.disable();
    testAppStore.disable();
    testAdminStore.disable();
  });

  // 1. Validator Tests
  describe('Notification Validators', () => {
    test('validateNotificationQuery sanitizes default pagination', () => {
      const result = validateNotificationQuery({});
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.sanitized.page, 1);
      assert.strictEqual(result.sanitized.limit, 10);
      assert.strictEqual(result.sanitized.isRead, undefined);
    });

    test('validateNotificationQuery parses isRead boolean string', () => {
      const readRes = validateNotificationQuery({ isRead: 'true', page: '2', limit: '20' });
      assert.strictEqual(readRes.sanitized.isRead, true);
      assert.strictEqual(readRes.sanitized.page, 2);
      assert.strictEqual(readRes.sanitized.limit, 20);

      const unreadRes = validateNotificationQuery({ isRead: 'false' });
      assert.strictEqual(unreadRes.sanitized.isRead, false);
    });

    test('validateNotificationId rejects empty or non-string IDs', () => {
      assert.strictEqual(validateNotificationId('').isValid, false);
      assert.strictEqual(validateNotificationId('   ').isValid, false);
      assert.strictEqual(validateNotificationId(null).isValid, false);
      assert.strictEqual(validateNotificationId('notif-123').isValid, true);
      assert.strictEqual(validateNotificationId('notif-123').sanitizedId, 'notif-123');
    });
  });

  // 2. Service Unit Tests
  describe('Notification Service', () => {
    test('createNotification adds record and respects idempotency', async () => {
      const notif1 = await notificationService.createNotification({
        recipient: userA._id,
        type: 'SYSTEM_ALERT',
        title: 'Platform Maintenance',
        message: 'Scheduled maintenance on Sunday',
        idempotencyKey: 'maint-2026-10-25',
      });

      assert.ok(notif1._id);
      assert.strictEqual(notif1.title, 'Platform Maintenance');
      assert.strictEqual(notif1.isRead, false);

      // Duplicate idempotency call should return existing record without adding new
      const notif2 = await notificationService.createNotification({
        recipient: userA._id,
        type: 'SYSTEM_ALERT',
        title: 'Platform Maintenance Duplicate',
        message: 'Duplicate text',
        idempotencyKey: 'maint-2026-10-25',
      });

      assert.strictEqual(notif2._id, notif1._id);
      assert.strictEqual(testNotificationStore.notifications.length, 1);
    });

    test('getNotifications returns paginated results sorted newest first', async () => {
      await notificationService.createNotification({
        recipient: userA._id,
        type: 'APPLICATION_STATUS_UPDATED',
        title: 'Application 1',
        message: 'Status: Shortlisted',
      });
      await notificationService.createNotification({
        recipient: userA._id,
        type: 'INTERVIEW_SCHEDULED',
        title: 'Application 2',
        message: 'Interview on Tuesday',
      });
      await notificationService.createNotification({
        recipient: userB._id,
        type: 'SYSTEM_ALERT',
        title: 'User B alert',
        message: 'For user B only',
      });

      const resA = await notificationService.getNotifications({
        userId: userA._id,
        page: 1,
        limit: 10,
      });

      assert.strictEqual(resA.notifications.length, 2);
      assert.strictEqual(resA.unreadCount, 2);
      assert.strictEqual(resA.notifications[0].title, 'Application 2'); // newest first
    });

    test('markAsRead enforces user ownership and updates read status', async () => {
      const notif = await notificationService.createNotification({
        recipient: userA._id,
        type: 'JOB_APPROVED',
        title: 'Job Approved',
        message: 'Your job has been approved',
      });

      // User B cannot mark User A's notification as read
      await assert.rejects(
        async () => {
          await notificationService.markAsRead({
            notificationId: notif._id,
            userId: userB._id,
          });
        },
        {
          statusCode: 403,
          code: 'FORBIDDEN_OWNERSHIP',
        }
      );

      // User A marks own notification as read
      const updated = await notificationService.markAsRead({
        notificationId: notif._id,
        userId: userA._id,
      });

      assert.strictEqual(updated.isRead, true);
      assert.ok(updated.readAt);

      const unread = await notificationService.getUnreadCount(userA._id);
      assert.strictEqual(unread.unreadCount, 0);
    });

    test('markAllAsRead marks all user notifications as read', async () => {
      await notificationService.createNotification({
        recipient: userA._id,
        type: 'SYSTEM_ALERT',
        title: 'Alert 1',
        message: 'Message 1',
      });
      await notificationService.createNotification({
        recipient: userA._id,
        type: 'SYSTEM_ALERT',
        title: 'Alert 2',
        message: 'Message 2',
      });

      const res = await notificationService.markAllAsRead(userA._id);
      assert.strictEqual(res.updatedCount, 2);

      const unread = await notificationService.getUnreadCount(userA._id);
      assert.strictEqual(unread.unreadCount, 0);
    });

    test('returns 503 DATABASE_UNAVAILABLE when test store is disabled and db disconnected', async () => {
      testNotificationStore.disable();

      await assert.rejects(
        async () => {
          await notificationService.getNotifications({ userId: userA._id });
        },
        {
          statusCode: 503,
          code: 'DATABASE_UNAVAILABLE',
        }
      );
    });
  });

  // 3. HTTP API Endpoints
  describe('Notification HTTP API Endpoints', () => {
    test('rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/notifications`);
      assert.strictEqual(res.status, 401);
    });

    test('GET /api/notifications returns user notifications', async () => {
      await notificationService.createNotification({
        recipient: userA._id,
        type: 'APPLICATION_STATUS_UPDATED',
        title: 'Application Shortlisted',
        message: 'You have been shortlisted',
      });

      const res = await fetch(`${BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${tokenA}`,
        },
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.length, 1);
      assert.strictEqual(data.data[0].title, 'Application Shortlisted');
      assert.strictEqual(data.unreadCount, 1);
    });

    test('GET /api/notifications/unread-count returns accurate count', async () => {
      await notificationService.createNotification({
        recipient: userA._id,
        type: 'APPLICATION_STATUS_UPDATED',
        title: 'Alert A1',
        message: 'Msg A1',
      });
      await notificationService.createNotification({
        recipient: userA._id,
        type: 'APPLICATION_STATUS_UPDATED',
        title: 'Alert A2',
        message: 'Msg A2',
      });

      const res = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${tokenA}`,
        },
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.unreadCount, 2);
    });

    test('PATCH /api/notifications/:id/read updates single notification', async () => {
      const notif = await notificationService.createNotification({
        recipient: userA._id,
        type: 'APPLICATION_SUBMITTED',
        title: 'New Candidate',
        message: 'Candidate applied',
      });

      const res = await fetch(`${BASE_URL}/api/notifications/${notif._id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
        },
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.isRead, true);
    });

    test('PATCH /api/notifications/:id/read returns 403 on other user notification', async () => {
      const notif = await notificationService.createNotification({
        recipient: userA._id,
        type: 'APPLICATION_SUBMITTED',
        title: 'Secret Notification',
        message: 'Not for user B',
      });

      const res = await fetch(`${BASE_URL}/api/notifications/${notif._id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenB}`,
        },
      });

      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error.code, 'FORBIDDEN_OWNERSHIP');
    });

    test('PATCH /api/notifications/read-all marks all notifications read', async () => {
      await notificationService.createNotification({
        recipient: userA._id,
        type: 'SYSTEM_ALERT',
        title: 'Alert 1',
        message: 'Msg 1',
      });
      await notificationService.createNotification({
        recipient: userA._id,
        type: 'SYSTEM_ALERT',
        title: 'Alert 2',
        message: 'Msg 2',
      });

      const res = await fetch(`${BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenA}`,
        },
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.updatedCount, 2);

      // Verify unread count is 0
      const countRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const countData = await countRes.json();
      assert.strictEqual(countData.unreadCount, 0);
    });
  });

  // 4. Workflow Triggers
  describe('Workflow Notification Integration', () => {
    test('Job application submission notifies the recruiter', async () => {
      // 1. Create a job
      const { job: mockJob } = await jobService.createJob(
        {
          title: 'Frontend React Developer',
          company: 'Godavari Software',
          status: 'published',
          town: 'Bhimavaram',
        },
        recruiterUser
      );

      // 2. Candidate applies for the job
      await applicationService.submitApplication(
        {
          jobId: mockJob._id || mockJob.id,
          coverLetter: 'Interested in this role',
        },
        userA
      );

      // 3. Verify recruiter received APPLICATION_SUBMITTED notification
      const recruiterNotifs = testNotificationStore.findByRecipient(recruiterUser._id);
      assert.strictEqual(recruiterNotifs.length, 1);
      assert.strictEqual(recruiterNotifs[0].type, 'APPLICATION_SUBMITTED');
      assert.strictEqual(recruiterNotifs[0].title, 'New Job Application Received');
      assert.match(recruiterNotifs[0].message, /Frontend React Developer/);
    });

    test('Recruiter status update and interview scheduling notifies candidate', async () => {
      const { job: mockJob } = await jobService.createJob(
        {
          title: 'Back-end Node Engineer',
          company: 'Delta Software',
          status: 'published',
        },
        recruiterUser
      );

      const appResult = await applicationService.submitApplication(
        { jobId: mockJob._id || mockJob.id },
        userA
      );
      const appId = appResult.application.id || appResult.application._id;

      // Recruiter schedules interview
      await applicationService.updateApplicationStatus(
        appId,
        {
          status: 'Interview Scheduled',
          notes: 'Technical round via Google Meet',
          interviewDetails: {
            scheduledAt: new Date(),
            locationOrLink: 'https://meet.google.com/xyz',
          },
        },
        recruiterUser
      );

      // Candidate should receive INTERVIEW_SCHEDULED notification
      const candidateNotifs = testNotificationStore.findByRecipient(userA._id);
      const interviewNotif = candidateNotifs.find((n) => n.type === 'INTERVIEW_SCHEDULED');
      assert.ok(interviewNotif);
      assert.strictEqual(interviewNotif.title, 'Interview Scheduled');
      assert.match(interviewNotif.message, /Back-end Node Engineer/);
    });

    test('Admin employer verification review notifies the employer', async () => {
      testAdminStore.seed({
        users: [
          {
            _id: recruiterUser._id,
            role: 'recruiter',
            name: 'Godavari Tech HR',
            email: recruiterUser.email,
            isVerified: false,
            verificationRequest: { status: 'pending' },
          },
        ],
      });

      await adminService.reviewEmployerVerification(
        recruiterUser._id,
        { status: 'approved', reason: 'Documents verified successfully' },
        adminUser
      );

      const employerNotifs = testNotificationStore.findByRecipient(recruiterUser._id);
      assert.strictEqual(employerNotifs.length, 1);
      assert.strictEqual(employerNotifs[0].type, 'EMPLOYER_VERIFIED');
      assert.strictEqual(employerNotifs[0].title, 'Employer Verification Approved');
    });

    test('Admin job moderation notifies recruiter of outcome', async () => {
      testAdminStore.seed({
        jobs: [
          {
            _id: 'job-mod-test-01',
            title: 'Field Sales Executive',
            recruiterId: recruiterUser._id,
            status: 'draft',
            moderationStatus: 'pending',
          },
        ],
      });

      await adminService.moderateJob(
        'job-mod-test-01',
        { action: 'approve', notes: 'Approved for posting' },
        adminUser
      );

      const recruiterNotifs = testNotificationStore.findByRecipient(recruiterUser._id);
      assert.strictEqual(recruiterNotifs.length, 1);
      assert.strictEqual(recruiterNotifs[0].type, 'JOB_APPROVED');
      assert.strictEqual(recruiterNotifs[0].title, 'Job Opening Approved');
      assert.match(recruiterNotifs[0].message, /Field Sales Executive/);
    });
  });
});
