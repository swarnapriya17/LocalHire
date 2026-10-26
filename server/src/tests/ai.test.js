import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { signToken } from '../utils/token.js';
import {
  validateCareerChat,
  validateProfileReview,
  validateSkillGap,
  validateInterviewQuestions,
  validateInterviewFeedback,
} from '../validators/ai.validator.js';
import {
  aiService,
  rateLimiter,
  formatGeminiContents,
  isRetryableStatus,
  isRetryableError,
  calculateBackoff,
} from '../services/ai.service.js';
import { config } from '../config/env.js';

let testServer;
let BASE_URL = 'http://localhost:5000';

const jobseekerUser = {
  _id: 'seeker-phase10-test-001',
  email: 'fresher.tanuku@localhire.dev',
  role: 'jobseeker',
  name: 'V. Krishna Murthy',
};

const recruiterUser = {
  _id: 'recruiter-phase10-test-002',
  email: 'hr.delta@localhire.dev',
  role: 'recruiter',
  name: 'Delta Recruiter',
};

const adminUser = {
  _id: 'admin-phase10-test-003',
  email: 'admin.lead@localhire.dev',
  role: 'admin',
  name: 'Platform Administrator',
};

const seekerToken = signToken(jobseekerUser);
const recruiterToken = signToken(recruiterUser);
const adminToken = signToken(adminUser);

describe('Phase 10: AI Career Assistant & LLM Integration Tests', () => {
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
    rateLimiter.reset();
    aiService.clearMockHandler();
    aiService.clearFetchOverride();
  });

  afterEach(() => {
    aiService.clearMockHandler();
    aiService.clearFetchOverride();
    rateLimiter.reset();
  });

  describe('AI Input Validation & Prompt Protection Rules', () => {
    test('validateCareerChat accepts valid messages and sanitizes history', () => {
      const res = validateCareerChat({
        message: 'How do I start as a junior React developer in Bhimavaram?',
        history: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Welcome to LocalHire AI!' },
        ],
      });
      assert.equal(res.isValid, true);
      assert.equal(res.sanitized.message, 'How do I start as a junior React developer in Bhimavaram?');
      assert.equal(res.sanitized.history.length, 2);
    });

    test('validateCareerChat rejects empty or excessively long inputs', () => {
      const res1 = validateCareerChat({ message: '' });
      assert.equal(res1.isValid, false);
      assert.ok(res1.errors.some((e) => e.includes('required')));

      const longText = 'x'.repeat(2500);
      const res2 = validateCareerChat({ message: longText });
      assert.equal(res2.isValid, false);
      assert.ok(res2.errors.some((e) => e.includes('2,000 characters')));
    });

    test('validateSkillGap requires target role and accepts skill lists', () => {
      const valid = validateSkillGap({
        targetRole: 'Junior Frontend Developer',
        currentSkills: ['HTML', 'CSS', 'JavaScript'],
        jobDescription: 'Seeking React fresher with responsive design knowledge.',
      });
      assert.equal(valid.isValid, true);
      assert.equal(valid.sanitized.targetRole, 'Junior Frontend Developer');
      assert.equal(valid.sanitized.currentSkills.length, 3);

      const invalid = validateSkillGap({ currentSkills: ['HTML'] });
      assert.equal(invalid.isValid, false);
      assert.ok(invalid.errors.some((e) => e.includes('Target role')));
    });

    test('validateInterviewFeedback validates minimum answer length', () => {
      const valid = validateInterviewFeedback({
        question: 'Tell me about a challenging project you worked on.',
        answer: 'During my final year project at DNR College, I built a local logistics app using MERN stack.',
        role: 'Full Stack Trainee',
      });
      assert.equal(valid.isValid, true);

      const tooShort = validateInterviewFeedback({
        question: 'Tell me about yourself.',
        answer: 'Hi.',
      });
      assert.equal(tooShort.isValid, false);
      assert.ok(tooShort.errors.some((e) => e.includes('10 characters')));
    });

    test('formatGeminiContents ensures conversation begins with user and alternates turns', () => {
      // Test 1: Leading assistant welcome message must be dropped
      const historyWithLeadingModel = [
        { role: 'assistant', content: 'Hello! I am your AI Career Assistant.' },
        { role: 'user', content: 'Tell me about jobs in Tanuku' },
        { role: 'assistant', content: 'Tanuku has agro-industrial roles.' },
      ];
      const res1 = formatGeminiContents(historyWithLeadingModel, 'What skills do I need?');
      assert.equal(res1[0].role, 'user');
      assert.equal(res1[0].parts[0].text, 'Tell me about jobs in Tanuku');
      assert.equal(res1[1].role, 'model');
      assert.equal(res1[2].role, 'user');
      assert.equal(res1[2].parts[0].text, 'What skills do I need?');

      // Test 2: Consecutive messages with same role are merged to satisfy Gemini strict schema
      const historyConsecutive = [
        { role: 'user', content: 'First message' },
        { role: 'user', content: 'Second follow-up message' },
      ];
      const res2 = formatGeminiContents(historyConsecutive, 'Third query');
      assert.equal(res2.length, 1);
      assert.equal(res2[0].role, 'user');
      assert.ok(res2[0].parts[0].text.includes('First message'));
      assert.ok(res2[0].parts[0].text.includes('Second follow-up message'));
      assert.ok(res2[0].parts[0].text.includes('Third query'));
    });
  });

  describe('AI Service Logic & Provider Mocking', () => {
    test('getStatus reports configuration state without exposing secrets', () => {
      const status = aiService.getStatus();
      assert.equal(typeof status.configured, 'boolean');
      assert.equal(typeof status.provider, 'string');
      assert.equal(typeof status.model, 'string');
      assert.equal(status.apiKey, undefined);
      assert.equal(status.llmApiKey, undefined);
    });

    test('callLLM throws 503 LLM_NOT_CONFIGURED when API key is missing and no mock set', async () => {
      const origKey = config.llmApiKey;
      config.llmApiKey = '';
      try {
        await assert.rejects(
          () => aiService.callLLM({ prompt: 'Hello' }),
          {
            code: 'LLM_NOT_CONFIGURED',
            statusCode: 503,
          }
        );
      } finally {
        config.llmApiKey = origKey;
      }
    });

    test('callLLM uses mockHandler when provided for isolated unit tests', async () => {
      aiService.setMockHandler(({ prompt }) => `Mock AI Response for: ${prompt}`);

      const res = await aiService.callLLM({ prompt: 'Career Advice for West Godavari' });
      assert.ok(res.includes('Mock AI Response for: Career Advice for West Godavari'));
    });

    test('chat method enforces per-user rate limit', async () => {
      aiService.setMockHandler(() => 'Advice reply');

      // Send 15 requests (allowed)
      for (let i = 0; i < 15; i++) {
        await aiService.chat({ message: `Message ${i}`, userId: jobseekerUser._id });
      }

      // 16th request must throw 429 RATE_LIMIT_EXCEEDED
      await assert.rejects(
        () => aiService.chat({ message: '16th message', userId: jobseekerUser._id }),
        {
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
        }
      );
    });

    test('skill-gap analysis produces structured roadmap with disclaimer', async () => {
      aiService.setMockHandler(({ prompt }) => `Skill Gap Analysis Result for ${prompt}`);

      const result = await aiService.analyzeSkillGap({
        targetRole: 'Data Analyst',
        currentSkills: ['Excel', 'SQL'],
        userId: jobseekerUser._id,
      });

      assert.equal(result.targetRole, 'Data Analyst');
      assert.ok(result.analysis.includes('Data Analyst'));
      assert.ok(result.disclaimer.includes('informational'));
    });

    test('interview feedback evaluates answer using STAR framework', async () => {
      aiService.setMockHandler(() => 'Feedback: Strong STAR structure. Highlights situation well.');

      const result = await aiService.provideInterviewFeedback({
        question: 'Describe a difficult bug you solved.',
        answer: 'In my college project, I encountered an asynchronous race condition in React useEffect.',
        role: 'React Trainee',
        userId: jobseekerUser._id,
      });

      assert.ok(result.feedback.includes('STAR'));
      assert.ok(result.disclaimer);
    });
  });

  describe('AI HTTP API Security & Authorization Enforcement', () => {
    test('POST /api/ai/chat strictly rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHENTICATED');
    });

    test('POST /api/ai/chat strictly denies recruiter accounts with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recruiterToken}`,
        },
        body: JSON.stringify({ message: 'Can I use this as a recruiter?' }),
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'FORBIDDEN_ROLE');
    });

    test('GET /api/ai/status returns configuration status without exposing credentials', async () => {
      const res = await fetch(`${BASE_URL}/api/ai/status`, {
        headers: { Authorization: `Bearer ${seekerToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(typeof body.data.configured, 'boolean');

      const raw = JSON.stringify(body);
      assert.equal(raw.includes('password'), false);
      assert.equal(raw.includes('apiKey'), false);
      assert.equal(raw.includes('sk-'), false);
    });

    test('POST /api/ai/chat returns 503 LLM_NOT_CONFIGURED when provider key is absent', async () => {
      const origKey = config.llmApiKey;
      config.llmApiKey = '';
      try {
        const res = await fetch(`${BASE_URL}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${seekerToken}`,
          },
          body: JSON.stringify({ message: 'Help me find fresher jobs in Eluru' }),
        });
        assert.equal(res.status, 503);
        const body = await res.json();
        assert.equal(body.success, false);
        assert.equal(body.error.code, 'LLM_NOT_CONFIGURED');
      } finally {
        config.llmApiKey = origKey;
      }
    });

    test('POST /api/ai/chat returns live AI response when mock provider is active', async () => {
      aiService.setMockHandler(() => 'Here is practical advice for freshers in West Godavari: Focus on core JavaScript, Git, and local business portfolio sites.');

      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${seekerToken}`,
        },
        body: JSON.stringify({ message: 'What skills are in demand in West Godavari?' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.reply.includes('West Godavari'));
      assert.ok(body.data.disclaimer);
    });

    test('POST /api/ai/skill-gap returns structured learning path', async () => {
      aiService.setMockHandler(() => 'Matching Skills: HTML/CSS. Recommended Gap Skills: React, Node.js. 4-Week Roadmap included.');

      const res = await fetch(`${BASE_URL}/api/ai/skill-gap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${seekerToken}`,
        },
        body: JSON.stringify({
          targetRole: 'Full Stack Web Developer',
          currentSkills: ['HTML', 'CSS', 'JavaScript'],
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.analysis.includes('Matching Skills'));
    });

    test('POST /api/ai/interview/questions generates role-specific practice questions', async () => {
      aiService.setMockHandler(() => '1. Explain React Virtual DOM. 2. How do you handle state? Sample STAR answers included.');

      const res = await fetch(`${BASE_URL}/api/ai/interview/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${seekerToken}`,
        },
        body: JSON.stringify({
          role: 'React Trainee',
          experienceLevel: 'Fresher / Entry-Level',
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.questions.includes('React'));
    });

    test('POST /api/ai/interview/feedback validates answer and returns constructive critique', async () => {
      aiService.setMockHandler(() => 'Strengths: Clear problem statement. Improvements: Mention quantitative impact.');

      const res = await fetch(`${BASE_URL}/api/ai/interview/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${seekerToken}`,
        },
        body: JSON.stringify({
          question: 'What is your greatest technical achievement?',
          answer: 'I deployed a college attendance portal using Express and MongoDB for 200 students.',
          role: 'Backend Developer',
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.feedback.includes('Strengths'));
    });

    test('POST /api/ai/profile-review returns 503 DATABASE_UNAVAILABLE when MongoDB is disconnected and no custom draft given', async () => {
      // With no customProfile supplied and MongoDB disconnected, personalized review returns 503
      const res = await fetch(`${BASE_URL}/api/ai/profile-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${seekerToken}`,
        },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'DATABASE_UNAVAILABLE');
    });

    test('POST /api/ai/profile-review succeeds when user supplies custom draft profile', async () => {
      aiService.setMockHandler(() => 'Profile Review: Summary is clear. Add metrics to projects section.');

      const res = await fetch(`${BASE_URL}/api/ai/profile-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${seekerToken}`,
        },
        body: JSON.stringify({
          profileData: {
            headline: 'B.Tech CSE Graduate | Passionate Frontend Developer',
            summary: 'Aspiring software developer with hands-on project experience in React and Node.js.',
            skills: ['JavaScript', 'React', 'CSS'],
          },
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.review.includes('Profile Review'));
    });
  });

  describe('AI Provider Retry Policy, Exponential Backoff & Model Fallback', () => {
    test('isRetryableStatus identifies 503, 429, and 5xx as retryable', () => {
      assert.equal(isRetryableStatus(503), true);
      assert.equal(isRetryableStatus(429), true);
      assert.equal(isRetryableStatus(500), true);
      assert.equal(isRetryableStatus(502), true);
      assert.equal(isRetryableStatus(504), true);

      assert.equal(isRetryableStatus(200), false);
      assert.equal(isRetryableStatus(400), false);
      assert.equal(isRetryableStatus(401), false);
      assert.equal(isRetryableStatus(403), false);
      assert.equal(isRetryableStatus(404), false);
    });

    test('isRetryableError distinguishes transient errors from client errors', () => {
      const netErr = new Error('fetch failed: socket hang up');
      const abortErr = new Error('Request aborted');
      abortErr.name = 'AbortError';

      assert.equal(isRetryableError(netErr), true);
      assert.equal(isRetryableError(abortErr), false);
    });

    test('calculateBackoff scales exponentially, caps at maxDelayMs, and includes jitter', () => {
      const d1 = calculateBackoff(1, 100, 1000, false);
      const d2 = calculateBackoff(2, 100, 1000, false);
      const d3 = calculateBackoff(3, 100, 1000, false);
      const dCap = calculateBackoff(10, 100, 1000, false);

      assert.equal(d1, 100);
      assert.equal(d2, 200);
      assert.equal(d3, 400);
      assert.equal(dCap, 1000);

      const dJitter = calculateBackoff(1, 100, 1000, true);
      assert.ok(dJitter >= 100 && dJitter <= 130);
    });

    test('callLLM recovers on second attempt after transient 503 error', async () => {
      let attempts = 0;
      aiService.setFetchOverride(async () => {
        attempts++;
        if (attempts === 1) {
          return {
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            json: async () => ({ error: { message: 'This model is currently experiencing high demand.' } }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'Recovered after retry!' }] } }],
          }),
        };
      });

      const res = await aiService.callLLM({ prompt: 'Test transient recovery' });
      assert.equal(res, 'Recovered after retry!');
      assert.equal(attempts, 2);
    });

    test('callLLM does not retry non-retryable 401 or 400 client errors', async () => {
      let attempts = 0;
      aiService.setFetchOverride(async () => {
        attempts++;
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: { message: 'Invalid API key.' } }),
        };
      });

      await assert.rejects(
        () => aiService.callLLM({ prompt: 'Test auth rejection' }),
        {
          code: 'LLM_AUTH_FAILED',
          statusCode: 502,
        }
      );
      assert.equal(attempts, 1);
    });

    test('callLLM falls back to secondary model when primary model exhausts retries with 503', async () => {
      const calledModels = [];
      aiService.setFetchOverride(async (url) => {
        const modelMatch = url.match(/models\/([^:]+):generateContent/);
        const requestedModel = modelMatch ? modelMatch[1] : 'unknown';
        calledModels.push(requestedModel);

        if (requestedModel === 'gemini-3.8-flash') {
          return {
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            json: async () => ({ error: { message: 'High demand spike' } }),
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'Answer from verified fallback model' }] } }],
          }),
        };
      });

      const res = await aiService.callLLM({ prompt: 'Test fallback trigger' });
      assert.equal(res, 'Answer from verified fallback model');
      assert.ok(calledModels.includes('gemini-3.8-flash'), 'Should have tried primary model');
      assert.ok(calledModels.includes('gemini-3.5-flash'), 'Should have fallen back to gemini-3.5-flash');
    });

    test('callLLM throws clean user-friendly error when both primary and fallback fail', async () => {
      aiService.setFetchOverride(async () => {
        return {
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({ error: { message: 'All models unavailable' } }),
        };
      });

      await assert.rejects(
        () => aiService.callLLM({ prompt: 'Test total exhaustion' }),
        (err) => {
          assert.equal(err.statusCode, 503);
          assert.ok(err.message.includes('high demand'));
          return true;
        }
      );
    });
  });
});
