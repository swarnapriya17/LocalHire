import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { signToken } from '../utils/token.js';
import { calculateProfileCompleteness } from '../utils/completeness.js';
import { validateProfileUpdate } from '../validators/profile.validator.js';

let testServer;
let BASE_URL = 'http://localhost:5000';

const jobseekerUser = {
  _id: 'seeker-phase6-test-101',
  email: 'bhimavaram.fresher@localhire.dev',
  role: 'jobseeker',
  name: 'Satyanarayana Raju',
};

const token = signToken(jobseekerUser);

describe('Phase 6: Job Seeker Profile & Career Management Tests', () => {
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

  // 1. Completeness Unit Tests
  describe('Profile Completeness Calculation Rules', () => {
    test('calculateProfileCompleteness returns 0% for empty profile', () => {
      const emptyUser = { name: '', jobseekerProfile: {} };
      const result = calculateProfileCompleteness(emptyUser);
      assert.equal(result.score, 0);
      assert.ok(result.incompleteSuggestions.length > 0);
      assert.ok(result.disclaimer.includes('not a certification or guarantee of employability'));
    });

    test('Freshers can achieve 100% profile completeness with zero work experience', () => {
      const fresherUser = {
        name: 'Lakshmi Varma',
        jobseekerProfile: {
          isFresher: true,
          headline: 'Aspiring Full Stack Engineer (React / Node.js)',
          summary: 'B.Tech graduate from Bhimavaram passionate about building modern web applications.',
          location: 'Bhimavaram',
          education: [
            {
              institution: 'SRKR Engineering College, Bhimavaram',
              degree: 'B.Tech in Computer Science',
              fieldOfStudy: 'Computer Science',
              graduationYear: '2026',
            },
          ],
          skills: ['JavaScript', 'React', 'HTML/CSS', 'Node.js'],
          softSkills: ['Teamwork', 'Communication'],
          workExperience: [], // Exactly zero corporate experience
          projects: [
            {
              title: 'West Godavari Local Market Web App',
              description: 'E-commerce platform connecting aquaculture traders with regional markets.',
              technologies: ['React', 'Express', 'MongoDB'],
            },
          ],
          jobPreferences: {
            preferredLocations: ['Bhimavaram', 'Tadepalligudem'],
            categories: ['it-software'],
            experienceLevel: 'Fresher / Entry-Level',
          },
        },
      };

      const result = calculateProfileCompleteness(fresherUser);
      assert.equal(result.isFresher, true);
      assert.equal(result.sections.experience.completed, true); // Exempted/completed for freshers
      assert.equal(result.score, 100);
      assert.equal(result.incompleteSuggestions.length, 0);
    });

    test('Experienced candidate profile penalizes missing work experience', () => {
      const expUser = {
        name: 'Ravi Teja',
        jobseekerProfile: {
          isFresher: false,
          headline: 'Senior Accounts Officer',
          summary: 'Experienced financial manager with 4 years handling regional ledgers.',
          location: 'Eluru',
          education: [
            {
              institution: 'Sir CR Reddy College, Eluru',
              degree: 'M.Com',
              fieldOfStudy: 'Finance',
              graduationYear: '2022',
            },
          ],
          skills: ['Tally Prime', 'GST Filing', 'MS Excel'],
          workExperience: [], // Missing work experience despite being marked experienced
          projects: [],
          certifications: [
            {
              name: 'Certified Tally Professional',
              issuingOrganization: 'Tally Education',
            },
          ],
          jobPreferences: {
            preferredLocations: ['Eluru'],
            categories: ['office-admin'],
          },
        },
      };

      const result = calculateProfileCompleteness(expUser);
      assert.equal(result.isFresher, false);
      assert.equal(result.sections.experience.completed, false);
      assert.ok(result.score < 100);
      assert.ok(result.incompleteSuggestions.some((s) => s.includes('corporate employment')));
    });
  });

  // 2. Validation & Security Allowlisting Unit Tests
  describe('Profile Validation & Field Allowlisting', () => {
    test('validateProfileUpdate strictly rejects tampering with sensitive role or accountStatus', () => {
      const maliciousPayload = {
        name: 'Hacker Name',
        role: 'admin', // Attack attempt
        accountStatus: 'active',
        password: 'NewPassword123!',
      };

      const result = validateProfileUpdate(maliciousPayload);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('role')));
      assert.ok(result.errors.some((e) => e.includes('accountStatus')));
      assert.ok(result.errors.some((e) => e.includes('password')));
    });

    test('validateProfileUpdate rejects dangerous or malformed URLs', () => {
      const invalidUrlPayload = {
        jobseekerProfile: {
          portfolioLinks: {
            portfolio: 'javascript:alert(1)', // XSS attempt
            github: 'not-a-valid-url',
          },
          projects: [
            {
              title: 'Portfolio Site',
              link: 'data:text/html,<script>alert(1)</script>',
            },
          ],
        },
      };

      const result = validateProfileUpdate(invalidUrlPayload);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('Portfolio website URL format is invalid')));
      assert.ok(result.errors.some((e) => e.includes('GitHub profile URL format is invalid')));
      assert.ok(result.errors.some((e) => e.includes('link format is invalid')));
    });

    test('validateProfileUpdate rejects malformed phone numbers', () => {
      const invalidPhonePayload = {
        jobseekerProfile: {
          phone: 'abc-not-a-number',
        },
      };

      const result = validateProfileUpdate(invalidPhonePayload);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some((e) => e.includes('Phone number format is invalid')));
    });

    test('validateProfileUpdate accepts valid jobseeker profile fields', () => {
      const validPayload = {
        name: 'Satyavathi Devi',
        jobseekerProfile: {
          headline: 'Quality Assurance Chemist',
          summary: 'MPEDA-standard aquaculture quality control specialist.',
          location: 'Bhimavaram',
          phone: '+91 9876543210',
          portfolioLinks: {
            portfolio: 'https://satyavathi.dev',
            linkedin: 'https://linkedin.com/in/satyavathi',
          },
          skills: ['Chemical Titration', 'Spectrophotometry', 'GLP'],
          softSkills: ['Detail-oriented', 'Safety Compliance'],
          education: [
            {
              institution: 'DNR College, Bhimavaram',
              degree: 'B.Sc in Chemistry',
              graduationYear: '2025',
            },
          ],
          privacySettings: {
            visibleToRecruiters: true,
            allowContact: true,
          },
        },
      };

      const result = validateProfileUpdate(validPayload);
      assert.equal(result.isValid, true);
      assert.equal(result.data.name, 'Satyavathi Devi');
      assert.equal(result.data.jobseekerProfile.headline, 'Quality Assurance Chemist');
      assert.equal(result.data.jobseekerProfile.phone, '+91 9876543210');
    });
  });

  // 3. API Integration & Error Guard Tests
  describe('Profile API Endpoint Security & Error Guard Tests', () => {
    test('GET /api/users/profile strictly rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/users/profile`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'UNAUTHENTICATED');
    });

    test('PUT /api/users/profile strictly rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized Name' }),
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'UNAUTHENTICATED');
    });

    test('PUT /api/users/profile rejects payload with sensitive role tampering with 400', async () => {
      const res = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

    test('PUT /api/users/profile returns 503 DATABASE_UNAVAILABLE when MongoDB Atlas is disconnected', async () => {
      const res = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Valid Jobseeker Name',
          jobseekerProfile: {
            headline: 'Frontend Engineer',
            location: 'Bhimavaram',
          },
        }),
      });

      assert.equal(res.status, 503);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'DATABASE_UNAVAILABLE');
      assert.match(data.error.message, /require.*MongoDB connection/i);
    });

    test('GET /api/users/profile returns 503 DATABASE_UNAVAILABLE when MongoDB Atlas is disconnected', async () => {
      const res = await fetch(`${BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(res.status, 503);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'DATABASE_UNAVAILABLE');
      assert.match(data.error.message, /requires an active MongoDB connection/i);
    });
  });
});
