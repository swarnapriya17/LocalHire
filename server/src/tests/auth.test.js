import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { signToken, verifyToken } from '../utils/token.js';
import { authorize } from '../middleware/auth.js';

describe('Auth Validation & Security Tests', () => {
  test('validateRegister accepts valid jobseeker payload', () => {
    const input = {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'StrongPassword123',
      role: 'jobseeker'
    };
    const result = validateRegister(input);
    assert.equal(result.isValid, true);
    assert.equal(result.data.name, 'Priya Sharma');
    assert.equal(result.data.email, 'priya@example.com');
    assert.equal(result.data.role, 'jobseeker');
  });

  test('validateRegister accepts valid recruiter payload', () => {
    const input = {
      name: 'Ramesh Varma',
      email: 'ramesh@godavaritech.com',
      password: 'RecruiterPassword2026',
      role: 'recruiter'
    };
    const result = validateRegister(input);
    assert.equal(result.isValid, true);
    assert.equal(result.data.role, 'recruiter');
  });

  test('validateRegister strictly rejects admin role in public registration', () => {
    const input = {
      name: 'Malicious User',
      email: 'attacker@example.com',
      password: 'Password123',
      role: 'admin'
    };
    const result = validateRegister(input);
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /administrative accounts cannot be created/i);
  });

  test('validateRegister rejects invalid email formats', () => {
    const input = {
      name: 'Test User',
      email: 'not-an-email',
      password: 'Password123',
      role: 'jobseeker'
    };
    const result = validateRegister(input);
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /valid email address/i);
  });

  test('validateRegister rejects passwords shorter than 8 characters', () => {
    const input = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
      role: 'jobseeker'
    };
    const result = validateRegister(input);
    assert.equal(result.isValid, false);
    assert.match(result.errors[0], /at least 8 characters/i);
  });

  test('validateLogin requires valid email and password', () => {
    assert.equal(validateLogin({ email: 'bad', password: '' }).isValid, false);
    assert.equal(validateLogin({ email: 'valid@example.com', password: 'password123' }).isValid, true);
  });

  test('signToken generates valid signed JWT and verifyToken decodes it correctly', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      role: 'recruiter'
    };

    const token = signToken(mockUser);
    assert.ok(typeof token === 'string');

    const decoded = verifyToken(token);
    assert.ok(decoded);
    assert.equal(decoded.userId, mockUser._id);
    assert.equal(decoded.email, mockUser.email);
    assert.equal(decoded.role, mockUser.role);
  });

  test('verifyToken returns null for tampered or invalid token', () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.signature';
    const decoded = verifyToken(invalidToken);
    assert.equal(decoded, null);
  });

  test('authorize middleware permits users with authorized role', () => {
    const middleware = authorize('recruiter', 'admin');
    let nextCalled = false;
    const req = { user: { role: 'recruiter' } };
    const res = {};
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    assert.equal(nextCalled, true);
  });

  test('authorize middleware denies users without authorized role with 403', () => {
    const middleware = authorize('admin');
    let statusCode = null;
    let jsonResponse = null;

    const req = { user: { role: 'jobseeker' } };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { jsonResponse = data; }
        };
      }
    };
    const next = () => {};

    middleware(req, res, next);
    assert.equal(statusCode, 403);
    assert.equal(jsonResponse.success, false);
    assert.equal(jsonResponse.error.code, 'FORBIDDEN_ROLE');
  });
});
