import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { signToken } from '../utils/token.js';

let testServer;
let BASE_URL = 'http://localhost:5000';

const recruiterUser = {
  _id: 'recruiter-test-101',
  email: 'recruiter@westgodavari.in',
  role: 'recruiter',
  name: 'Test Recruiter',
};

const jobseekerUser = {
  _id: 'seeker-test-202',
  email: 'seeker@westgodavari.in',
  role: 'jobseeker',
  name: 'Test Seeker',
};

const adminUser = {
  _id: 'admin-test-303',
  email: 'admin@localhire.in',
  role: 'admin',
  name: 'Test Administrator',
};

const recruiterToken = signToken(recruiterUser);
const jobseekerToken = signToken(jobseekerUser);
const adminToken = signToken(adminUser);

describe('Phase 5: Job Management & Listings API Tests', () => {
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
  test('GET /api/jobs returns published jobs list with count and pagination', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.total >= 10);
    assert.ok(body.count > 0);
    assert.ok(body.persistenceMode);
  });

  test('GET /api/jobs?keyword=react filters jobs by keyword', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs?keyword=react`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.length > 0);
    const hasReact = body.data.some(
      (j) => j.title.toLowerCase().includes('react') || j.description.toLowerCase().includes('react')
    );
    assert.equal(hasReact, true);
  });

  test('GET /api/jobs?category=it-software filters jobs by industry sector', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs?category=it-software`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    for (const job of body.data) {
      assert.equal(job.category, 'it-software');
    }
  });

  test('GET /api/jobs?town=Bhimavaram filters jobs by West Godavari location', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs?town=Bhimavaram`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.length > 0);
    for (const job of body.data) {
      assert.equal(job.town.toLowerCase(), 'bhimavaram');
    }
  });

  test('GET /api/jobs?isFresher=true filters jobs for fresher candidates', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs?isFresher=true`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.length > 0);
    for (const job of body.data) {
      assert.equal(job.isFresher, true);
    }
  });

  test('GET /api/jobs/:id returns existing job details', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/job-1`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.job.id, 'job-1');
    assert.ok(body.job.title);
    assert.ok(body.job.company);
  });

  test('GET /api/jobs/:id returns 404 for non-existent job ID', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/non-existent-id-99999`);
    assert.equal(res.status, 404);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'JOB_NOT_FOUND');
  });

  test('POST /api/jobs strictly rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized Role' }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'UNAUTHENTICATED');
  });

  test('POST /api/jobs strictly rejects unauthorized jobseeker accounts with 403', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jobseekerToken}`,
      },
      body: JSON.stringify({
        title: 'Software Developer',
        company: 'Seeker Tech',
        town: 'Bhimavaram',
        category: 'it-software',
        description: 'Comprehensive software engineering role for local candidates in West Godavari.',
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'FORBIDDEN_ROLE');
  });

  test('POST /api/jobs validates payload and rejects invalid submissions with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiterToken}`,
      },
      body: JSON.stringify({
        title: 'AB', // Too short
        company: '',
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  let createdJobId = null;

  test('POST /api/jobs successfully publishes job vacancy for authorized recruiter', async () => {
    const newJob = {
      title: 'Full Stack Node.js Developer',
      company: 'Godavari Software Hub',
      town: 'Bhimavaram',
      locationDetail: 'Near Somaram Temple, Bhimavaram',
      category: 'it-software',
      employmentType: 'Full-time',
      workMode: 'Hybrid',
      experience: '1 - 3 Years',
      isFresher: false,
      salary: '₹4.5 - ₹6.5 LPA',
      description: 'Develop scalable backend services and responsive React frontend components for local enterprise clients in West Godavari.',
      responsibilities: ['Build robust REST APIs with Express.js', 'Collaborate with frontend engineers'],
      requirements: ['Proficient in JavaScript / Node.js', 'Experience with MongoDB or SQL databases'],
      perks: ['Health insurance', 'Hybrid work policy'],
    };

    const res = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiterToken}`,
      },
      body: JSON.stringify(newJob),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.job.id);
    assert.equal(body.job.title, 'Full Stack Node.js Developer');
    assert.equal(body.job.town, 'Bhimavaram');
    createdJobId = body.job.id;
  });

  test('GET /api/jobs/recruiter/my-jobs returns vacancies created by current recruiter', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/recruiter/my-jobs`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.jobs));
    const createdFound = body.jobs.some((j) => String(j.id) === String(createdJobId));
    assert.equal(createdFound, true);
  });

  test('PUT /api/jobs/:id updates job vacancy for owner recruiter', async () => {
    assert.ok(createdJobId, 'createdJobId must be defined');

    const res = await fetch(`${BASE_URL}/api/jobs/${createdJobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiterToken}`,
      },
      body: JSON.stringify({
        salary: '₹5.0 - ₹7.0 LPA',
        urgency: 'Priority Hiring',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.job.salary, '₹5.0 - ₹7.0 LPA');
    assert.equal(body.job.urgency, 'Priority Hiring');
  });

  test('PUT /api/jobs/:id strictly denies unauthorized recruiter from editing others jobs with 403', async () => {
    assert.ok(createdJobId, 'createdJobId must be defined');

    const otherRecruiterToken = signToken({
      _id: 'other-recruiter-999',
      email: 'competitor@recruiter.com',
      role: 'recruiter',
      name: 'Other Recruiter',
    });

    const res = await fetch(`${BASE_URL}/api/jobs/${createdJobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherRecruiterToken}`,
      },
      body: JSON.stringify({
        title: 'Tampered Title Attempt',
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'FORBIDDEN');
  });

  test('DELETE /api/jobs/:id removes job vacancy for owner or admin', async () => {
    assert.ok(createdJobId, 'createdJobId must be defined');

    const res = await fetch(`${BASE_URL}/api/jobs/${createdJobId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    // Verify it is no longer retrieved
    const checkRes = await fetch(`${BASE_URL}/api/jobs/${createdJobId}`);
    assert.equal(checkRes.status, 404);
  });
});
