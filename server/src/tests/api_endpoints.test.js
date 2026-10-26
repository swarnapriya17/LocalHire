import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { getDatabaseStatus, isDbConnected, connectDB } from '../config/db.js';

let testServer;
let BASE_URL = 'http://localhost:5000';

describe('Phase 4: API Endpoint Integration & Error Guard Tests', () => {
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

  test('GET /api/health reports database connection status safely', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.service, 'LocalHire API');
    assert.ok(data.database);
    assert.equal(data.database.provider, 'MongoDB Atlas');
    assert.equal(typeof data.database.connected, 'boolean');
    assert.equal(data.database.password, undefined);
    assert.equal(data.database.uri, undefined);
    assert.ok(['connected', 'disconnected', 'connecting', 'disconnecting'].includes(data.database.status));
  });

  test('getDatabaseStatus reflects Mongoose readyState accurately without credential leaks', () => {
    const status = getDatabaseStatus();
    assert.ok(typeof status.connected === 'boolean');
    assert.equal(status.provider, 'MongoDB Atlas');
    assert.equal(status.password, undefined);
    assert.equal(status.uri, undefined);
    assert.equal(isDbConnected(), status.connected);
  });

  test('POST /api/auth/register rejects payload with missing required fields with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'invalid' }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'VALIDATION_ERROR');
  });

  test('POST /api/auth/register strictly rejects public registration as admin with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Admin',
        email: 'attacker@localhire.dev',
        password: 'Password123!',
        role: 'admin',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error.message, /administrative accounts cannot be created/i);
  });

  test('POST /api/auth/register safely returns 503 DATABASE_UNAVAILABLE when MongoDB Atlas is disconnected', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Valid Jobseeker',
        email: 'seeker@example.com',
        password: 'JobseekerPass123!',
        role: 'jobseeker',
      }),
    });

    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'DATABASE_UNAVAILABLE');
    assert.match(data.error.message, /requires a MongoDB connection/i);
  });

  test('POST /api/auth/login rejects empty credentials with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'VALIDATION_ERROR');
  });

  test('POST /api/auth/login safely returns 503 DATABASE_UNAVAILABLE when MongoDB Atlas is disconnected', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'SomePassword123!',
      }),
    });

    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'DATABASE_UNAVAILABLE');
    assert.match(data.error.message, /requires a MongoDB connection/i);
  });

  test('GET /api/auth/me rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'UNAUTHENTICATED');
  });

  test('POST /api/auth/logout successfully clears session and returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.match(data.message, /Signed out successfully/i);
  });

  test('GET /api/auth/test/jobseeker requires authentication and rejects with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/test/jobseeker`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'UNAUTHENTICATED');
  });
});
