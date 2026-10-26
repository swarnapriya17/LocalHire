import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/user.model.js';
import { maskMongoUri, getDatabaseStatus, requireDb } from '../config/db.js';

describe('Phase 4: Mongoose User Model & MongoDB Architecture Tests', () => {
  test('User schema normalizes email to lowercase and trims whitespace', async () => {
    const user = new User({
      name: '  Kavitha Reddy  ',
      email: '  KAVITHA@EXAMPLE.COM  ',
      password: 'StrongSecretPassword2026!',
      role: 'jobseeker',
    });

    // Run Mongoose validation
    await user.validate();

    assert.equal(user.email, 'kavitha@example.com');
    assert.equal(user.name, 'Kavitha Reddy');
  });

  test('User schema hashes plain password into passwordHash before validation', async () => {
    const plainPassword = 'MySecretPassword123!';
    const user = new User({
      name: 'Ravi Kumar',
      email: 'ravi@example.com',
      password: plainPassword,
      role: 'recruiter',
    });

    // Run validation to trigger pre-validate hook
    await user.validate();

    assert.ok(user.passwordHash);
    assert.notEqual(user.passwordHash, plainPassword);
    assert.match(user.passwordHash, /^\$2[aby]\$\d+\$/); // bcrypt hash format
  });

  test('User comparePassword correctly validates match and rejects invalid candidate', async () => {
    const plainPassword = 'CorrectPassword@2026';
    const user = new User({
      name: 'Nagaraju V',
      email: 'nagaraju@example.com',
      password: plainPassword,
      role: 'jobseeker',
    });

    await user.validate();

    const isMatch = await user.comparePassword(plainPassword);
    assert.equal(isMatch, true);

    const isMismatch = await user.comparePassword('WrongPassword123');
    assert.equal(isMismatch, false);
  });

  test('User toJSON() strips passwordHash, plainPassword, and __v', async () => {
    const user = new User({
      name: 'Suresh Babu',
      email: 'suresh@example.com',
      password: 'SamplePassword123!',
      role: 'jobseeker',
    });

    await user.validate();

    const json = user.toJSON();
    assert.equal(json.name, 'Suresh Babu');
    assert.equal(json.email, 'suresh@example.com');
    assert.equal(json.role, 'jobseeker');
    assert.equal(json.accountStatus, 'active');
    assert.equal(json.passwordHash, undefined);
    assert.equal(json.password, undefined);
    assert.equal(json._plainPassword, undefined);
    assert.equal(json.__v, undefined);
  });

  test('User schema sets default accountStatus to active', async () => {
    const user = new User({
      name: 'Venkatesh Rao',
      email: 'venkatesh@example.com',
      password: 'Password12345!',
      role: 'recruiter',
    });

    await user.validate();
    assert.equal(user.accountStatus, 'active');
  });

  test('User schema rejects invalid role values', async () => {
    const user = new User({
      name: 'Hacker User',
      email: 'hacker@example.com',
      password: 'Password12345!',
      role: 'superadmin',
    });

    let error = null;
    try {
      await user.validate();
    } catch (err) {
      error = err;
    }

    assert.ok(error);
    assert.ok(error.errors.role);
  });

  test('maskMongoUri safely masks credentials from MongoDB connection URI', () => {
    const sensitiveUri = 'mongodb+srv://admin_user:SuperSecretP%40ss@cluster0.abcde.mongodb.net/localhire?retryWrites=true&w=majority';
    const masked = maskMongoUri(sensitiveUri);

    assert.equal(masked.includes('SuperSecretP%40ss'), false);
    assert.equal(masked.includes('admin_user:'), false);
    assert.ok(masked.startsWith('mongodb+srv://***:***@cluster0.abcde.mongodb.net/'));
  });

  test('getDatabaseStatus reports connection state without exposing secrets', () => {
    const status = getDatabaseStatus();

    assert.ok(typeof status.connected === 'boolean');
    assert.ok(typeof status.status === 'string');
    assert.equal(status.provider, 'MongoDB Atlas');
    assert.equal(status.uri, undefined); // Never leak raw connection URI
  });

  test('requireDb middleware blocks mutations with 503 when disconnected', () => {
    let statusCode = null;
    let jsonResponse = null;

    const req = {};
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { jsonResponse = data; }
        };
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    // When no active connection exists
    requireDb(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(statusCode, 503);
    assert.equal(jsonResponse.success, false);
    assert.equal(jsonResponse.error.code, 'DATABASE_UNAVAILABLE');
    assert.match(jsonResponse.error.message, /Database connection required/i);
  });
});
