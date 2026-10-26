import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import NotificationBell from './NotificationBell';
import styles from './Navbar.module.css';

export default function Navbar({ savedCount = 0, onOpenSavedJobs }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavClick = (sectionId) => {
    closeMobileMenu();
    // If not on homepage, navigate to homepage with hash
    if (window.location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'recruiter') return '/recruiter/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/student/dashboard';
  };

  const handleSignOut = async () => {
    closeMobileMenu();
    await logout();
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.navContainer}>
        {/* Brand */}
        <Link 
          to="/" 
          className={styles.brand} 
          onClick={() => handleNavClick('hero')} 
          aria-label="LocalHire Home"
        >
          <div className={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div className={styles.logoText}>
            <span className={styles.brandName}>LocalHire</span>
            <span className={styles.brandSub}>WEST GODAVARI</span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className={styles.navLinks} aria-label="Main Navigation">
          <a href="#hero" className={styles.navLink} onClick={(e) => { e.preventDefault(); handleNavClick('hero'); }}>
            {t('nav.home', 'Home')}
          </a>
          <a href="#jobs" className={styles.navLink} onClick={(e) => { e.preventDefault(); handleNavClick('jobs'); }}>
            {t('nav.findJobs', 'Find Jobs')}
          </a>
          <a href="#categories" className={styles.navLink} onClick={(e) => { e.preventDefault(); handleNavClick('categories'); }}>
            {t('nav.categories', 'Categories')}
          </a>
          <a href="#employers" className={styles.navLink} onClick={(e) => { e.preventDefault(); handleNavClick('employers'); }}>
            {t('nav.companies', 'Companies')}
          </a>
          <a href="#regions" className={styles.navLink} onClick={(e) => { e.preventDefault(); handleNavClick('regions'); }}>
            {t('nav.region', 'West Godavari')}
          </a>
          <a href="#resources" className={styles.navLink} onClick={(e) => { e.preventDefault(); handleNavClick('resources'); }}>
            {t('nav.resources', 'Career Resources')}
          </a>
        </nav>

        {/* Right Actions */}
        <div className={styles.navActions}>
          <LanguageSelector />

          {isAuthenticated && <NotificationBell />}

          {savedCount > 0 && (
            <button 
              className={styles.savedBtn} 
              onClick={onOpenSavedJobs}
              title="View bookmarked jobs"
            >
              <span>❤️</span> {t('nav.savedJobs', 'Saved')} ({savedCount})
            </button>
          )}

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link 
                to={getDashboardPath()} 
                className={styles.postJobBtn}
                style={{ padding: '0.45rem 0.95rem' }}
                title={`Go to ${user.role} dashboard`}
              >
                <span>👤</span>
                <span>{t('nav.dashboard', 'Dashboard')}</span>
              </Link>

              <button 
                type="button" 
                className={styles.loginBtn}
                onClick={handleSignOut}
                title="Sign out of account"
              >
                {t('nav.signOut', 'Sign Out')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link to="/login" className={styles.loginBtn}>
                {t('nav.login', 'Login')}
              </Link>

              <Link to="/register?role=recruiter" className={styles.postJobBtn}>
                <span>+</span> {t('nav.postJob', 'Post a Job')}
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            className={styles.mobileMenuBtn} 
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.mobileDrawerOpen : ''}`}>
        <a href="#hero" className={styles.mobileNavLink} onClick={(e) => { e.preventDefault(); handleNavClick('hero'); }}>
          <span>{t('nav.home', 'Home')}</span> <span>→</span>
        </a>
        <a href="#jobs" className={styles.mobileNavLink} onClick={(e) => { e.preventDefault(); handleNavClick('jobs'); }}>
          <span>{t('nav.findJobs', 'Find Jobs')}</span> <span>→</span>
        </a>
        <a href="#categories" className={styles.mobileNavLink} onClick={(e) => { e.preventDefault(); handleNavClick('categories'); }}>
          <span>{t('nav.categories', 'Categories')}</span> <span>→</span>
        </a>
        <a href="#employers" className={styles.mobileNavLink} onClick={(e) => { e.preventDefault(); handleNavClick('employers'); }}>
          <span>{t('nav.companies', 'Companies')}</span> <span>→</span>
        </a>
        <a href="#regions" className={styles.mobileNavLink} onClick={(e) => { e.preventDefault(); handleNavClick('regions'); }}>
          <span>{t('nav.region', 'West Godavari')}</span> <span>→</span>
        </a>
        <a href="#resources" className={styles.mobileNavLink} onClick={(e) => { e.preventDefault(); handleNavClick('resources'); }}>
          <span>{t('nav.resources', 'Career Resources')}</span> <span>→</span>
        </a>

        <div className={styles.mobileActions}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <LanguageSelector />
          </div>

          {savedCount > 0 && (
            <button 
              className={styles.savedBtn} 
              style={{ justifyContent: 'center', width: '100%', padding: '0.65rem' }}
              onClick={() => { closeMobileMenu(); onOpenSavedJobs(); }}
            >
              <span>❤️</span> {t('nav.savedJobs', 'Saved')} ({savedCount})
            </button>
          )}

          {isAuthenticated ? (
            <>
              <Link 
                to={getDashboardPath()} 
                className={styles.postJobBtn}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={closeMobileMenu}
              >
                {t('nav.dashboard', 'Dashboard')} ({user.role.toUpperCase()})
              </Link>
              <button 
                type="button" 
                className={styles.loginBtn}
                style={{ width: '100%' }}
                onClick={handleSignOut}
              >
                {t('nav.signOut', 'Sign Out')}
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={styles.loginBtn} 
                style={{ width: '100%', textAlign: 'center', display: 'block' }}
                onClick={closeMobileMenu}
              >
                Login to Account
              </Link>
              <Link 
                to="/register" 
                className={styles.postJobBtn} 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={closeMobileMenu}
              >
                Create Candidate Account
              </Link>
              <Link 
                to="/register?role=recruiter" 
                className={styles.loginBtn} 
                style={{ width: '100%', textAlign: 'center', display: 'block' }}
                onClick={closeMobileMenu}
              >
                Post a Job (Employer Sign Up)
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
