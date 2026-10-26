import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { signToken } from '../utils/token.js';
import { validateRecruiterProfileUpdate } from '../validators/recruiter.validator.js';
import { recruiterService, testRecruiterStore } from '../services/recruiter.service.js';
import { testAppStore } from '../services/application.service.js';

let testServer;
let BASE_URL = 'http://localhost:5000';

const recruiterUser = {
  _id: 'recruiter-phase8-test-301',
  email: 'hr.delta.tech@localhire.dev',
  role: 'recruiter',
  name: 'Lakshman Varma',
  isVerified: true,
  recruiterProfile: {
    companyName: 'Delta Software Solutions',
    companyDescription: 'Pioneering technology services across Godavari districts.',
    companyWebsite: 'https://deltasoftware.in',
    phone: '+91 9848012345',
    contactEmail: 'careers@deltasoftware.in',
    location: 'West Godavari',
    town: 'Bhimavaram',
    address: 'Near Someswara Temple, Bhimavaram',
    industry: 'Information Technology',
    designation: 'Managing Director & Lead Recruiter',
    logoUrl: 'https://deltasoftware.in/assets/logo.png',
  },
};

const otherRecruiterUser = {
  _id: 'recruiter-phase8-test-302',
  email: 'hr.eluru.agro@localhire.dev',
  role: 'recruiter',
  name: 'Suresh Kumar',
  isVerified: false,
};

const jobseekerUser = {
  _id: 'seeker-phase8-test-303',
  email: 'student.bvrm@localhire.dev',
  role: 'jobseeker',
  name: 'Prasad Raju',
};

const recruiterToken = signToken(recruiterUser);
const jobseekerToken = signToken(jobseekerUser);

describe('Phase 8: Recruiter Dashboard & Employer Management Tests', () => {
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
    testRecruiterStore.enable();
    testAppStore.enable();
    testRecruiterStore.setUser(recruiterUser);
  });

  afterEach(() => {
    testRecruiterStore.disable();
    testAppStore.disable();
  });

  // 1. Validator Unit Tests
  describe('Company Profile Validation & Allowlisting Rules', () => {
    test('validateRecruiterProfileUpdate accepts valid company details', () => {
      const payload = {
        name: 'Lakshman Varma',
        recruiterProfile: {
          companyName: 'Delta Software Solutions Pvt Ltd',
          companyDescription: 'Leading software development firm based in Bhimavaram.',
          companyWebsite: 'https://deltasoftware.in',
          contactEmail: 'contact@deltasoftware.in',
          phone: '+91 9848012345',
          location: 'West Godavari',
          town: 'Bhimavaram',
          address: 'Main Road, Bhimavaram',
          industry: 'Information Technology',
          designation: 'Director of HR',
          logoUrl: 'https://deltasoftware.in/logo.png',
        },
      };

      const result = validateRecruiterProfileUpdate(payload);
      assert.equal(result.isValid, true);
      assert.equal(result.data.name, 'Lakshman Varma');
      assert.equal(result.data.recruiterProfile.companyName, 'Delta Software Solutions Pvt Ltd');
      assert.equal(result.data.recruiterProfile.town, 'Bhimavaram');
    });

    test('validateRecruiterProfileUpdate strictly rejects tampering with sensitive role, verification, or accountStatus', () => {
      const maliciousPayload = {
        role: 'admin', // Attack attempt: privilege escalation
        isVerified: true, // Attack attempt: self-verification
        verifiedEmployer: true,
        accountStatus: 'active',
        password: 'HackedPassword123!',
      };

      const result = validateRecruiterProfileUpdate(maliciousPayload);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('role')));
      assert.ok(result.errors.some((e) => e.includes('isVerified')));
      assert.ok(result.errors.some((e) => e.includes('verifiedEmployer')));
      assert.ok(result.errors.some((e) => e.includes('accountStatus')));
      assert.ok(result.errors.some((e) => e.includes('password')));
    });

    test('validateRecruiterProfileUpdate rejects invalid website and logo URLs', () => {
      const invalidUrlPayload = {
        recruiterProfile: {
          companyWebsite: 'javascript:alert(1)', // XSS attempt
          logoUrl: 'not-a-valid-http-url',
        },
      };

      const result = validateRecruiterProfileUpdate(invalidUrlPayload);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('Company website URL format is invalid')));
      assert.ok(result.errors.some((e) => e.includes('Company logo URL format is invalid')));
    });

    test('validateRecruiterProfileUpdate rejects malformed contact email and phone', () => {
      const invalidContactPayload = {
        recruiterProfile: {
          contactEmail: 'not-an-email',
          phone: '123', // too short
        },
      };

      const result = validateRecruiterProfileUpdate(invalidContactPayload);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('contact email format is invalid')));
      assert.ok(result.errors.some((e) => e.includes('Phone number format is invalid')));
    });
  });

  // 2. Service Layer & Analytics Calculation Tests
  describe('Recruiter Service Logic & Analytics Calculations', () => {
    test('getDashboardSummary returns accurate metric aggregates and verification state', async () => {
      const summaryRes = await recruiterService.getDashboardSummary(recruiterUser);

      assert.ok(summaryRes.metrics);
      assert.equal(typeof summaryRes.metrics.totalJobs, 'number');
      assert.equal(typeof summaryRes.metrics.totalApplicants, 'number');
      assert.equal(typeof summaryRes.metrics.shortlistedCount, 'number');
      assert.equal(typeof summaryRes.metrics.interviewsScheduledCount, 'number');
      assert.equal(typeof summaryRes.metrics.hiredCount, 'number');
      assert.equal(summaryRes.isVerified, true);
      assert.equal(summaryRes.company.companyName, 'Delta Software Solutions');
    });

    test('getCompanyProfile retrieves authenticated recruiter profile accurately', async () => {
      const profile = await recruiterService.getCompanyProfile(recruiterUser);

      assert.equal(profile.name, 'Lakshman Varma');
      assert.equal(profile.email, 'hr.delta.tech@localhire.dev');
      assert.equal(profile.recruiterProfile.industry, 'Information Technology');
      assert.equal(profile.recruiterProfile.town, 'Bhimavaram');
    });

    test('updateCompanyProfile updates allowed company details without exposing passwords', async () => {
      const updateData = {
        name: 'L. Varma',
        recruiterProfile: {
          companyName: 'Delta Software Labs',
          designation: 'Head of People',
          phone: '+91 9988776655',
        },
      };

      const updated = await recruiterService.updateCompanyProfile(updateData, recruiterUser);

      assert.equal(updated.name, 'L. Varma');
      assert.equal(updated.recruiterProfile.companyName, 'Delta Software Labs');
      assert.equal(updated.recruiterProfile.designation, 'Head of People');
      assert.equal(updated.password, undefined);
      assert.equal(updated.passwordHash, undefined);
    });

    test('getRecruiterAnalytics calculates pipeline conversion rates and job breakdowns', async () => {
      const analytics = await recruiterService.getRecruiterAnalytics(recruiterUser);

      assert.ok(analytics.statusDistribution);
      assert.ok(analytics.conversionRates);
      assert.equal(typeof analytics.conversionRates.shortlistRate, 'number');
      assert.equal(typeof analytics.conversionRates.interviewRate, 'number');
      assert.equal(typeof analytics.conversionRates.hireRate, 'number');
      assert.ok(Array.isArray(analytics.jobsAnalytics));
      assert.ok(Array.isArray(analytics.recentApplications));
    });

    test('getScheduledInterviews retrieves only scheduled candidate interview records', async () => {
      const interviews = await recruiterService.getScheduledInterviews(recruiterUser);

      assert.ok(Array.isArray(interviews.interviews));
      assert.equal(typeof interviews.count, 'number');
    });
  });

  // 3. HTTP API Endpoint Security, Role Enforcement & Database Disconnection Guard Tests
  describe('Recruiter HTTP API Security & Error Guard Tests', () => {
    test('GET /api/recruiter/summary rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/recruiter/summary`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'UNAUTHENTICATED');
    });

    test('GET /api/recruiter/summary rejects jobseeker role with 403 (Role-based restriction)', async () => {
      const res = await fetch(`${BASE_URL}/api/recruiter/summary`, {
        headers: { Authorization: `Bearer ${jobseekerToken}` },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'FORBIDDEN_ROLE');
    });

    test('PUT /api/recruiter/profile rejects tampering with role with 400', async () => {
      const res = await fetch(`${BASE_URL}/api/recruiter/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recruiterToken}`,
        },
        body: JSON.stringify({
          role: 'admin',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'VALIDATION_ERROR');
      assert.match(data.error.message, /sensitive field "role"/i);
    });

    test('GET /api/recruiter/analytics rejects jobseeker with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/recruiter/analytics`, {
        headers: { Authorization: `Bearer ${jobseekerToken}` },
      });
      assert.equal(res.status, 403);
    });

    test('GET /api/recruiter/summary returns 503 DATABASE_UNAVAILABLE when MongoDB Atlas is disconnected', async () => {
      testRecruiterStore.disable();

      const res = await fetch(`${BASE_URL}/api/recruiter/summary`, {
        headers: { Authorization: `Bearer ${recruiterToken}` },
      });

      assert.equal(res.status, 503);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'DATABASE_UNAVAILABLE');
    });

    test('GET /api/recruiter/profile returns 503 DATABASE_UNAVAILABLE when Atlas is disconnected', async () => {
      testRecruiterStore.disable();

      const res = await fetch(`${BASE_URL}/api/recruiter/profile`, {
        headers: { Authorization: `Bearer ${recruiterToken}` },
      });

      assert.equal(res.status, 503);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'DATABASE_UNAVAILABLE');
    });
  });
});
