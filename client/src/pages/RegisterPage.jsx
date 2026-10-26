import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/common/LanguageSelector';
import styles from './RegisterPage.module.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'jobseeker';

  const { register } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dbNotice, setDbNotice] = useState('');

  // Password strength calculator
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 1:
        return { score: 25, text: t('auth.strengthWeak', 'Weak (add numbers & uppercase)'), color: '#EF4444' };
      case 2:
        return { score: 50, text: t('auth.strengthFair', 'Fair (add special characters)'), color: '#F59E0B' };
      case 3:
        return { score: 75, text: t('auth.strengthGood', 'Good (strong protection)'), color: '#3B82F6' };
      case 4:
        return { score: 100, text: t('auth.strengthExcellent', 'Excellent & secure'), color: '#10B981' };
      default:
        return { score: 10, text: t('auth.strengthTooShort', 'Too short (min 8 characters)'), color: '#EF4444' };
    }
  };

  const strength = calculateStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setDbNotice('');

    // Client-side validations
    if (formData.name.trim().length < 2) {
      setErrorMessage(t('auth.valNameRequired', 'Full name must be at least 2 characters long.'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage(t('auth.valEmailValid', 'Please enter a valid email address.'));
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage(t('auth.valPasswordLength', 'Password must be at least 8 characters long.'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(t('auth.valPasswordMatch', 'Passwords do not match. Please verify your entries.'));
      return;
    }

    if (!formData.acceptTerms) {
      setErrorMessage(t('auth.valTermsRequired', 'You must accept the terms of service and privacy commitment.'));
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      });

      // Redirect to designated dashboard
      if (user.role === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      if (err.status === 503) {
        setDbNotice(err.message);
      } else {
        setErrorMessage(err.message || 'Registration failed. Please check your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.authCard}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <LanguageSelector />
        </div>

        <div className={styles.header}>
          <div className={styles.brandPill}>
            <span>📍</span> {t('auth.newMemberReg', 'New Member Registration')}
          </div>
          <h1 className={styles.title}>{t('auth.registerTitle', 'Create Your Account')}</h1>
          <p className={styles.subtitle}>
            {t('auth.registerSubtitle', 'Join the West Godavari employment network as a job seeker or local employer')}
          </p>
        </div>

        {/* Database Unavailable Alert Notice (Honest report) */}
        {dbNotice && (
          <div className={styles.dbNoticeAlert}>
            <span>⚠️</span>
            <div>
              <strong>MongoDB Atlas Required:</strong> {dbNotice}
              <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', opacity: 0.9 }}>
                Backend validation passed. Configure <code>MONGODB_URI</code> in <code>server/.env</code> to persist registration data.
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className={styles.errorAlert} role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Account Type Selection */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>{t('auth.selectRole', 'Account Type & Purpose')}:</label>
            <div className={styles.roleSelector} role="radiogroup" aria-label="Account Type">
              <div
                className={`${styles.roleOption} ${formData.role === 'jobseeker' ? styles.roleOptionActive : ''}`}
                onClick={() => setFormData({ ...formData, role: 'jobseeker' })}
                role="radio"
                aria-checked={formData.role === 'jobseeker'}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setFormData({ ...formData, role: 'jobseeker' }); }}
              >
                <span className={styles.roleIcon}>🎓</span>
                <span className={styles.roleTitle}>{t('auth.jobseekerRoleTitle', 'Job Seeker & Student')}</span>
                <span className={styles.roleDesc}>{t('auth.jobseekerRoleDesc', 'Find local IT, non-IT & fresher jobs')}</span>
              </div>

              <div
                className={`${styles.roleOption} ${formData.role === 'recruiter' ? styles.roleOptionActive : ''}`}
                onClick={() => setFormData({ ...formData, role: 'recruiter' })}
                role="radio"
                aria-checked={formData.role === 'recruiter'}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setFormData({ ...formData, role: 'recruiter' }); }}
              >
                <span className={styles.roleIcon}>🏢</span>
                <span className={styles.roleTitle}>{t('auth.recruiterRoleTitle', 'Local Employer & Recruiter')}</span>
                <span className={styles.roleDesc}>{t('auth.recruiterRoleDesc', 'Post vacancies, review Godavari candidates')}</span>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className={styles.inputGroup}>
            <label htmlFor="register-name" className={styles.label}>
              {t('auth.fullNameLabel', 'Full Name')} *
            </label>
            <input
              id="register-name"
              type="text"
              required
              className={styles.input}
              placeholder={t('auth.fullNamePlaceholder', 'e.g. Ramesh Varma or Priya Kumari')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="register-email" className={styles.label}>
              {t('auth.emailLabel', 'Email Address')} *
            </label>
            <input
              id="register-email"
              type="email"
              required
              className={styles.input}
              placeholder={t('auth.emailPlaceholder', 'e.g. yourname@example.com')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="register-password" className={styles.label}>
              {t('auth.passwordLabel', 'Password')} (Min 8 characters) *
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                className={`${styles.input} ${styles.inputWithBtn}`}
                placeholder={t('auth.passwordPlaceholder', 'Create a secure password')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className={styles.showPasswordBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className={styles.strengthMeter}>
                <div className={styles.strengthBarWrapper}>
                  <div
                    className={styles.strengthBar}
                    style={{
                      width: `${strength.score}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
                <span className={styles.strengthLabel} style={{ color: strength.color }}>
                  {strength.text}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="register-confirm" className={styles.label}>
              {t('auth.confirmPasswordLabel', 'Confirm Password')} *
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="register-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className={`${styles.input} ${styles.inputWithBtn}`}
                placeholder={t('auth.confirmPasswordPlaceholder', 'Repeat your password')}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                className={styles.showPasswordBtn}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Terms Acceptance */}
          <label className={styles.checkboxGroup}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              required
            />
            <span>
              {t('auth.acceptTermsLabel', 'I accept the Terms of Service and acknowledge the platform privacy guidelines for West Godavari.')}
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.creatingAccount', 'Creating your account...') : `${t('auth.createAccountBtn', 'Create LocalHire Account')} →`}
          </button>
        </form>

        <div className={styles.footerLinks}>
          {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
          <Link to="/login" className={styles.switchLink}>
            {t('auth.loginHere', 'Sign In Here')}
          </Link>
        </div>
      </div>
    </div>
  );
}
