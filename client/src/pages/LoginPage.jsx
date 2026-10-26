import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/common/LanguageSelector';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dbNotice, setDbNotice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setDbNotice('');

    // Client-side validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setErrorMessage(t('auth.valEmailValid', 'Please enter a valid email address.'));
      return;
    }

    if (!formData.password) {
      setErrorMessage(t('auth.valPasswordRequired', 'Please enter your password.'));
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Redirect target: check if redirected from a protected route
      const destination = location.state?.from?.pathname;
      if (destination) {
        navigate(destination, { replace: true });
        return;
      }

      // Role-based default destination
      if (user.role === 'recruiter') {
        navigate('/recruiter/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      if (err.status === 503) {
        setDbNotice(err.message);
      } else {
        setErrorMessage(err.message || 'Invalid email or password.');
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
            <span>🔐</span> {t('auth.memberSignIn', 'Member Sign In')}
          </div>
          <h1 className={styles.title}>{t('auth.loginTitle', 'Welcome Back')}</h1>
          <p className={styles.subtitle}>
            {t('auth.loginSubtitle', 'Sign in to access your LocalHire portal and opportunities')}
          </p>
        </div>

        {/* Database Unavailable Alert Notice (Honest report) */}
        {dbNotice && (
          <div className={styles.dbNoticeAlert}>
            <span>⚠️</span>
            <div>
              <strong>MongoDB Atlas Required:</strong> {dbNotice}
              <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', opacity: 0.9 }}>
                To enable persistent authentication, configure <code>MONGODB_URI</code> in <code>server/.env</code>.
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
          {/* Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="login-email" className={styles.label}>
              {t('auth.emailLabel', 'Email Address')} *
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className={styles.label}>
              {t('auth.passwordLabel', 'Password')} *
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                className={`${styles.input} ${styles.inputWithBtn}`}
                placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.signingIn', 'Signing In...') : `${t('auth.signInBtn', 'Sign In to Portal')} →`}
          </button>
        </form>

        <div className={styles.footerLinks}>
          {t('auth.noAccount', "Don't have a LocalHire account yet?")}{' '}
          <Link to="/register" className={styles.switchLink}>
            {t('auth.registerNow', 'Register Here')}
          </Link>
        </div>

        <div className={styles.adminHint}>
          🛡️ Administrator access is provisioned securely through the CLI (<code>npm run create-admin</code>).
        </div>
      </div>
    </div>
  );
}
