import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { signToken } from '../utils/token.js';
import {
  validateCreateApplication,
  validateUpdateStatus,
} from '../validators/application.validator.js';
import { applicationService, testAppStore } from '../services/application.service.js';
import { jobService } from '../services/job.service.js';
import Application, { APPLICATION_STATUSES } from '../models/application.model.js';

let testServer;
let BASE_URL = 'http://localhost:5000';

const jobseekerUser = {
  _id: 'seeker-phase7-test-101',
  email: 'fresher.bhimavaram@localhire.dev',
  role: 'jobseeker',
  name: 'K. Venkata Rao',
};

const otherJobseekerUser = {
  _id: 'seeker-phase7-test-102',
  email: 'other.candidate@localhire.dev',
  role: 'jobseeker',
  name: 'P. Sai Kumar',
};

const recruiterUser = {
  _id: 'recruiter-phase7-test-201',
  email: 'hr.bhimavaram.tech@localhire.dev',
  role: 'recruiter',
  name: 'Bhimavaram Tech HR',
};

const otherRecruiterUser = {
  _id: 'recruiter-phase7-test-202',
  email: 'hr.eluru.retail@localhire.dev',
  role: 'recruiter',
  name: 'Eluru Retail HR',
};

const seekerToken = signToken(jobseekerUser);
const recruiterToken = signToken(recruiterUser);

describe('Phase 7: Job Applications & Tracking Tests', () => {
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
    testAppStore.enable();
  });

  afterEach(() => {
    testAppStore.disable();
  });

  // 1. Data Model & Status Enum Checks
  describe('Application Model & Status Definitions', () => {
    test('Application statuses include all mandatory lifecycle stages', () => {
      const required = [
        'Applied',
        'Under Review',
        'Shortlisted',
        'Interview Scheduled',
        'Rejected',
        'Hired',
      ];
      for (const st of required) {
        assert.ok(APPLICATION_STATUSES.includes(st), `Missing status: ${st}`);
      }
    });

    test('Application model defines unique compound index on applicant and job', () => {
      const indexes = Application.schema.indexes();
      const hasCompoundUnique = indexes.some(
        ([fields, options]) => fields.applicant === 1 && fields.job === 1 && options?.unique === true
      );
      assert.ok(hasCompoundUnique, 'Expected unique compound index on { applicant: 1, job: 1 }');
    });
  });

  // 2. Validator Unit Tests
  describe('Application Input Validation & Security Rules', () => {
    test('validateCreateApplication accepts valid job application payload', () => {
      const payload = {
        jobId: 'job-bvrm-it-01',
        coverLetter: 'I am a passionate fresher from Bhimavaram excited about this React role.',
        resumeUrl: 'https://localhire.dev/resumes/venkat.pdf',
      };
      const res = validateCreateApplication(payload);
      assert.equal(res.isValid, true);
      assert.equal(res.data.jobId, 'job-bvrm-it-01');
      assert.ok(res.data.coverLetter.includes('passionate fresher'));
    });

    test('validateCreateApplication strictly blocks tampering with status or recruiter notes', () => {
      const maliciousPayload = {
        jobId: 'job-bvrm-it-01',
        status: 'Hired', // Attempting to self-hire
        recruiterNotes: 'Top candidate approved.',
        applicant: 'attacker-id',
      };
      const res = validateCreateApplication(maliciousPayload);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('status')));
      assert.ok(res.errors.some((e) => e.includes('recruiterNotes')));
      assert.ok(res.errors.some((e) => e.includes('applicant')));
    });

    test('validateCreateApplication rejects non-http/https resume URLs', () => {
      const payload = {
        jobId: 'job-bvrm-it-01',
        resumeUrl: 'javascript:alert("xss")',
      };
      const res = validateCreateApplication(payload);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('valid http:// or https:// URL')));
    });

    test('validateUpdateStatus requires interview details when status is Interview Scheduled', () => {
      const invalidPayload = {
        status: 'Interview Scheduled',
        notes: 'Interview scheduled',
      };
      const res = validateUpdateStatus(invalidPayload);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('Interview details')));
    });

    test('validateUpdateStatus accepts valid interview scheduling details', () => {
      const validPayload = {
        status: 'Interview Scheduled',
        notes: 'Technical round with team lead',
        interviewDetails: {
          interviewDate: '2026-11-05',
          interviewTime: '10:30 AM IST',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          location: 'Bhimavaram Tech Hub, 2nd Floor',
        },
      };
      const res = validateUpdateStatus(validPayload);
      assert.equal(res.isValid, true);
      assert.equal(res.data.status, 'Interview Scheduled');
      assert.equal(res.data.interviewDetails.interviewDate, '2026-11-05');
      assert.equal(res.data.interviewDetails.meetingLink, 'https://meet.google.com/abc-defg-hij');
    });
  });

  // 3. Service Layer Business Logic & Duplicate Prevention
  describe('Application Service Logic & Ownership Checks', () => {
    test('Job seeker can submit an application for an existing published job', async () => {
      // First ensure a published job exists
      const jobs = await jobService.getJobs({ limit: 1 });
      assert.ok(jobs.jobs.length > 0);
      const testJob = jobs.jobs[0];

      const result = await applicationService.submitApplication(
        {
          jobId: testJob.id || testJob._id,
          coverLetter: 'Excited about regional opportunities in West Godavari.',
        },
        jobseekerUser
      );

      assert.ok(result.application);
      assert.equal(result.application.status, 'Applied');
      assert.equal(String(result.application.applicant), jobseekerUser._id);
    });

    test('Duplicate application is strictly prevented with 409 DUPLICATE_APPLICATION', async () => {
      const jobs = await jobService.getJobs({ limit: 1 });
      const testJob = jobs.jobs[0];
      const jobId = testJob.id || testJob._id;

      // First submission
      await applicationService.submitApplication(
        { jobId, coverLetter: 'First application' },
        jobseekerUser
      );

      // Attempt second submission
      await assert.rejects(
        async () => {
          await applicationService.submitApplication(
            { jobId, coverLetter: 'Duplicate attempt' },
            jobseekerUser
          );
        },
        (err) => {
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'DUPLICATE_APPLICATION');
          assert.match(err.message, /already applied/i);
          return true;
        }
      );
    });

    test('Candidate cannot apply to a closed or unpublished job', async () => {
      // Create a temporary closed job
      const closedJob = {
        id: 'job-closed-test-999',
        _id: 'job-closed-test-999',
        title: 'Closed Opening',
        company: 'Old Company',
        status: 'closed',
      };
      // Mock getJobById for closed job
      const origGet = jobService.getJobById;
      jobService.getJobById = async (id) => {
        if (id === 'job-closed-test-999') return { job: closedJob };
        return origGet.call(jobService, id);
      };

      try {
        await assert.rejects(
          async () => {
            await applicationService.submitApplication(
              { jobId: 'job-closed-test-999' },
              jobseekerUser
            );
          },
          (err) => {
            assert.equal(err.statusCode, 400);
            assert.equal(err.code, 'JOB_NOT_PUBLISHED');
            return true;
          }
        );
      } finally {
        jobService.getJobById = origGet;
      }
    });

    test('Job seeker can view only their own application history', async () => {
      const jobs = await jobService.getJobs({ limit: 2 });
      const job1 = jobs.jobs[0];

      await applicationService.submitApplication(
        { jobId: job1.id || job1._id, coverLetter: 'Application by user 101' },
        jobseekerUser
      );

      const user1History = await applicationService.getMyApplications(jobseekerUser);
      assert.equal(user1History.count, 1);
      assert.equal(String(user1History.applications[0].applicant), jobseekerUser._id);

      const otherUserHistory = await applicationService.getMyApplications(otherJobseekerUser);
      assert.equal(otherUserHistory.count, 0);
    });

    test('Unauthorized recruiter cannot view applications for jobs they do not own', async () => {
      const myJob = {
        id: 'job-owner-recruiter-1',
        _id: 'job-owner-recruiter-1',
        title: 'Owner Job',
        company: 'Bhimavaram Tech',
        recruiterId: recruiterUser._id,
      };

      const origGet = jobService.getJobById;
      jobService.getJobById = async (id) => {
        if (id === 'job-owner-recruiter-1') return { job: myJob };
        return origGet.call(jobService, id);
      };

      try {
        // Other recruiter attempts to view applications
        await assert.rejects(
          async () => {
            await applicationService.getJobApplications('job-owner-recruiter-1', otherRecruiterUser);
          },
          (err) => {
            assert.equal(err.statusCode, 403);
            assert.match(err.message, /Access denied.*only view applications.*you posted/i);
            return true;
          }
        );

        // Owner recruiter CAN view applications
        const ownerView = await applicationService.getJobApplications('job-owner-recruiter-1', recruiterUser);
        assert.ok(ownerView.applications);
      } finally {
        jobService.getJobById = origGet;
      }
    });

    test('Recruiter can update status and record history, while candidate is strictly denied', async () => {
      const ownerJob = {
        id: 'job-status-test-1',
        _id: 'job-status-test-1',
        title: 'Lead Architect',
        recruiterId: recruiterUser._id,
        status: 'published',
      };

      const origGet = jobService.getJobById;
      jobService.getJobById = async (id) => {
        if (id === 'job-status-test-1') return { job: ownerJob };
        return origGet.call(jobService, id);
      };

      try {
        const appRes = await applicationService.submitApplication(
          { jobId: 'job-status-test-1' },
          jobseekerUser
        );
        const appId = appRes.application.id || appRes.application._id;

        // Candidate attempts to update their own status to 'Hired' -> 403 Forbidden
        await assert.rejects(
          async () => {
            await applicationService.updateApplicationStatus(
              appId,
              { status: 'Hired' },
              jobseekerUser
            );
          },
          (err) => {
            assert.equal(err.statusCode, 403);
            assert.match(err.message, /Candidates cannot update application status/i);
            return true;
          }
        );

        // Authorized recruiter updates status to 'Shortlisted'
        const updated = await applicationService.updateApplicationStatus(
          appId,
          { status: 'Shortlisted', notes: 'Strong profile in local market projects' },
          recruiterUser
        );

        assert.equal(updated.application.status, 'Shortlisted');
        assert.equal(updated.application.statusHistory.length, 2);
        assert.equal(updated.application.statusHistory[1].status, 'Shortlisted');
      } finally {
        jobService.getJobById = origGet;
      }
    });
  });

  // 4. HTTP API Endpoints & Disconnection Guard Tests
  describe('Application HTTP API Security & Error Guard Tests', () => {
    test('POST /api/applications strictly rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: 'job-01' }),
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'UNAUTHENTICATED');
    });

    test('POST /api/applications rejects recruiter submission with 403 (Job-seeker-only rule)', async () => {
      const res = await fetch(`${BASE_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recruiterToken}`,
        },
        body: JSON.stringify({ jobId: 'job-01' }),
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'FORBIDDEN_ROLE');
    });

    test('GET /api/applications/my rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/applications/my`);
      assert.equal(res.status, 401);
    });

    test('POST /api/applications returns 503 DATABASE_UNAVAILABLE when Atlas is disconnected', async () => {
      // Ensure testAppStore is disabled to test live server behavior
      testAppStore.disable();

      const res = await fetch(`${BASE_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${seekerToken}`,
        },
        body: JSON.stringify({ jobId: 'job-01' }),
      });

      assert.equal(res.status, 503);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'DATABASE_UNAVAILABLE');
      assert.match(data.error.message, /requires an active MongoDB connection/i);
    });

    test('GET /api/applications/my returns 503 DATABASE_UNAVAILABLE when Atlas is disconnected', async () => {
      testAppStore.disable();

      const res = await fetch(`${BASE_URL}/api/applications/my`, {
        headers: { Authorization: `Bearer ${seekerToken}` },
      });

      assert.equal(res.status, 503);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'DATABASE_UNAVAILABLE');
    });
  });
});
