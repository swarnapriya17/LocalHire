import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Client translation dictionary paths
const enPath = path.resolve(__dirname, '../../../client/src/translations/en.js');
const tePath = path.resolve(__dirname, '../../../client/src/translations/te.js');

describe('Translation Dictionaries & Fallback Audit', () => {
  it('should load English and Telugu translation files successfully', async () => {
    const enModule = await import(`file://${enPath.replace(/\\/g, '/')}`);
    const teModule = await import(`file://${tePath.replace(/\\/g, '/')}`);

    assert.ok(enModule.default, 'en.js should export default dictionary');
    assert.ok(teModule.default, 'te.js should export default dictionary');
  });

  it('should contain all required namespaces in both dictionaries', async () => {
    const en = (await import(`file://${enPath.replace(/\\/g, '/')}`)).default;
    const te = (await import(`file://${tePath.replace(/\\/g, '/')}`)).default;

    const requiredNamespaces = [
      'nav',
      'auth',
      'hero',
      'freshers',
      'employers',
      'resources',
      'regions',
      'aiShowcase',
      'footer',
      'jobs',
      'jobseeker',
      'status',
      'recruiter',
      'admin',
      'profile',
      'ai',
      'modals',
    ];

    for (const ns of requiredNamespaces) {
      assert.ok(en[ns], `en dictionary missing namespace: ${ns}`);
      assert.ok(te[ns], `te dictionary missing namespace: ${ns}`);
      assert.equal(typeof en[ns], 'object', `en[${ns}] should be an object`);
      assert.equal(typeof te[ns], 'object', `te[${ns}] should be an object`);
    }
  });

  it('should verify Telugu dictionary covers core authentication keys', async () => {
    const te = (await import(`file://${tePath.replace(/\\/g, '/')}`)).default;

    assert.ok(te.auth.loginTitle, 'te.auth.loginTitle must be defined');
    assert.ok(te.auth.registerTitle, 'te.auth.registerTitle must be defined');
    assert.ok(te.auth.fullNameLabel, 'te.auth.fullNameLabel must be defined');
    assert.ok(te.auth.emailLabel, 'te.auth.emailLabel must be defined');
    assert.ok(te.auth.passwordLabel, 'te.auth.passwordLabel must be defined');
    assert.ok(te.auth.selectRole, 'te.auth.selectRole must be defined');
  });

  it('should verify Telugu dictionary covers AI Career Assistant keys', async () => {
    const te = (await import(`file://${tePath.replace(/\\/g, '/')}`)).default;

    assert.ok(te.ai.title, 'te.ai.title must be defined');
    assert.ok(te.ai.subtitle, 'te.ai.subtitle must be defined');
    assert.ok(te.ai.chatTab, 'te.ai.chatTab must be defined');
    assert.ok(te.ai.resumeTab, 'te.ai.resumeTab must be defined');
    assert.ok(te.ai.skillGapTab, 'te.ai.skillGapTab must be defined');
    assert.ok(te.ai.interviewTab, 'te.ai.interviewTab must be defined');
  });

  it('should verify Telugu dictionary covers recruiter and admin dashboards', async () => {
    const te = (await import(`file://${tePath.replace(/\\/g, '/')}`)).default;

    assert.ok(te.recruiter.dashboardTitle, 'te.recruiter.dashboardTitle must be defined');
    assert.ok(te.recruiter.postNewJob, 'te.recruiter.postNewJob must be defined');
    assert.ok(te.recruiter.candidatePipeline, 'te.recruiter.candidatePipeline must be defined');
    assert.ok(te.admin.dashboardTitle, 'te.admin.dashboardTitle must be defined');
    assert.ok(te.admin.totalUsers, 'te.admin.totalUsers must be defined');
  });

  it('should test fallback mechanism when key is missing in Telugu', async () => {
    const en = (await import(`file://${enPath.replace(/\\/g, '/')}`)).default;
    const te = (await import(`file://${tePath.replace(/\\/g, '/')}`)).default;

    // Simulation of t() logic from LanguageContext
    function translate(lang, keyPath, fallback = '') {
      const dict = lang === 'te' ? te : en;
      const parts = keyPath.split('.');
      let current = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }
      if (typeof current === 'string') return current;

      // Fallback to English
      if (lang !== 'en') {
        let enCurrent = en;
        for (const part of parts) {
          if (enCurrent && typeof enCurrent === 'object' && part in enCurrent) {
            enCurrent = enCurrent[part];
          } else {
            enCurrent = undefined;
            break;
          }
        }
        if (typeof enCurrent === 'string') return enCurrent;
      }

      return fallback || keyPath;
    }

    // 1. Existing Telugu key
    const teNav = translate('te', 'nav.home');
    assert.equal(teNav, 'హోమ్');

    // 2. Fallback to English if missing in Telugu
    const fallbackVal = translate('te', 'nonexistent.nested.key', 'Default Fallback');
    assert.equal(fallbackVal, 'Default Fallback');

    // 3. Fallback to key path if no fallback provided
    const keyFallback = translate('te', 'nonexistent.key');
    assert.equal(keyFallback, 'nonexistent.key');
  });
});
