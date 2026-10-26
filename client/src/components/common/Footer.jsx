import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from './Modal';
import styles from './Footer.module.css';

export default function Footer({ onNavClick, onOpenPostJob, onShowToast }) {
  const { language, setLanguage, t } = useLanguage();
  const [activeLegalModal, setActiveLegalModal] = useState(null); // 'privacy' | 'terms' | 'accessibility' | 'contact'

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (lang === 'te') {
      if (onShowToast) {
        onShowToast('భాష తెలుగులోకి మార్చబడింది.', 'info');
      }
    } else {
      if (onShowToast) {
        onShowToast('Language set to English.', 'info');
      }
    }
  };

  const handleLinkClick = (sectionId) => {
    if (onNavClick) {
      onNavClick(sectionId);
    } else {
      const elem = document.getElementById(sectionId);
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Top Multi-Column Grid */}
        <div className={styles.topGrid}>
          {/* Brand Col */}
          <div className={styles.brandCol}>
            <div className={styles.brandLogo}>
              <div className={styles.logoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <span className={styles.brandName}>LocalHire</span>
            </div>

            <div className={styles.tagline}>{t('footer.tagline', 'Local Jobs. Limitless Opportunities.')}</div>

            <p className={styles.brandDesc}>
              {t('footer.brandDesc', 'Connecting job seekers with verified local employers across West Godavari district, Andhra Pradesh. Empowering IT, commercial, agricultural, and fresher careers.')}
            </p>

            <div className={styles.districtPill}>
              <span>📍</span> {t('footer.districtPill', 'West Godavari District, AP')}
            </div>

            {/* Language Switcher */}
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                {t('footer.portalLang', 'Portal Language:')}
              </span>
              <div className={styles.langBox}>
                <button
                  type="button"
                  className={`${styles.langBtn} ${language === 'en' ? styles.langActive : ''}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`${styles.langBtn} ${language === 'te' ? styles.langActive : ''}`}
                  onClick={() => handleLanguageChange('te')}
                  title="తెలుగు స్థానికీకరణ (Telugu)"
                >
                  తెలుగు (Telugu)
                </button>
              </div>
            </div>
          </div>

          {/* Col 1: Job Seekers */}
          <div className={styles.navCol}>
            <h4 className={styles.colHeading}>{t('footer.quickLinks', 'For Job Seekers')}</h4>
            <ul className={styles.linkList}>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('jobs')}>
                  {t('nav.findJobs', 'Find Local Jobs')}
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('categories')}>
                  {t('nav.categories', 'Career Categories')}
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('freshers')}>
                  {t('freshers.title', 'Fresher Trainee Roles')}
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('ai-assistant')}>
                  {t('ai.title', 'AI Career Assistant')}
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('resources')}>
                  {t('resources.title', 'Career Playbooks')}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: For Employers */}
          <div className={styles.navCol}>
            <h4 className={styles.colHeading}>{t('footer.employerServices', 'For Employers')}</h4>
            <ul className={styles.linkList}>
              <li>
                <button type="button" className={styles.footerLink} onClick={onOpenPostJob}>
                  {t('nav.postJob', 'Post a Job Opening')}
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('employers')}>
                  {t('employers.title', 'Employer Showcase')}
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={onOpenPostJob}>
                  {t('recruiter.verificationBadge', 'Verification Standards')}
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={onOpenPostJob}>
                  {t('recruiter.welcome', 'Recruiter Onboarding')}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: West Godavari Hubs */}
          <div className={styles.navCol}>
            <h4 className={styles.colHeading}>{t('footer.districtTowns', 'Regional Hubs')}</h4>
            <ul className={styles.linkList}>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('regions')}>
                  Bhimavaram (Tech & Aqua)
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('regions')}>
                  Eluru (Admin & Health)
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('regions')}>
                  Tadepalligudem (NIT Hub)
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('regions')}>
                  Tanuku (Industrial)
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => handleLinkClick('regions')}>
                  Palakollu & Narsapur
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Support & Legal */}
          <div className={styles.navCol}>
            <h4 className={styles.colHeading}>{t('footer.legalSupport', 'Support & Trust')}</h4>
            <ul className={styles.linkList}>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => setActiveLegalModal('contact')}>
                  {t('footer.contactSupport', 'Help & Contact Desk')}
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => setActiveLegalModal('privacy')}>
                  {t('footer.privacyPolicy', 'Privacy Policy')}
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => setActiveLegalModal('terms')}>
                  {t('footer.termsOfService', 'Terms of Service')}
                </button>
              </li>
              <li>
                <button type="button" className={styles.footerLink} onClick={() => setActiveLegalModal('accessibility')}>
                  {t('footer.trustSafety', 'Accessibility Commitment')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomRow}>
          <div>
            © {new Date().getFullYear()} LocalHire. {t('footer.rightsReserved', 'Crafted for West Godavari District, Andhra Pradesh.')}
          </div>

          <div className={styles.legalLinks}>
            <button type="button" className={styles.legalLink} onClick={() => setActiveLegalModal('privacy')}>
              {t('footer.privacyPolicy', 'Privacy')}
            </button>
            <span>•</span>
            <button type="button" className={styles.legalLink} onClick={() => setActiveLegalModal('terms')}>
              {t('footer.termsOfService', 'Terms')}
            </button>
            <span>•</span>
            <button type="button" className={styles.legalLink} onClick={() => setActiveLegalModal('accessibility')}>
              {t('footer.trustSafety', 'Accessibility')}
            </button>
          </div>
        </div>
      </div>

      {/* Information & Legal Modals */}
      {activeLegalModal === 'contact' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveLegalModal(null)}
          title="Contact & Help Desk"
          subtitle="LocalHire Support Team — West Godavari"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.6 }}>
            <p>
              Have questions about listing your jobs, verifying employer status, or navigating opportunities in West Godavari?
            </p>
            <div style={{ background: 'rgba(11, 16, 32, 0.6)', padding: '1.25rem', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div><strong>📍 Regional Office:</strong> Bhimavaram, West Godavari District, Andhra Pradesh 534201</div>
              <div style={{ marginTop: '0.5rem' }}><strong>📧 General Enquiries:</strong> support@localhire.dev</div>
              <div style={{ marginTop: '0.5rem' }}><strong>💼 Employer Verification:</strong> verification@localhire.dev</div>
            </div>
          </div>
        </Modal>
      )}

      {activeLegalModal === 'privacy' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveLegalModal(null)}
          title="Privacy Commitment"
          subtitle="Data Protection for Local Job Seekers & Employers"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p>
              LocalHire is built specifically for West Godavari district candidates. We never sell personal contact information or candidate resumes to third-party telemarketers.
            </p>
            <p>
              Contact details (email, phone) are only shared with verified employers when you explicitly submit an application.
            </p>
          </div>
        </Modal>
      )}

      {activeLegalModal === 'terms' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveLegalModal(null)}
          title="Terms of Service"
          subtitle="Fair Hiring & Platform Standards"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p>
              1. <strong>Zero Candidate Fees:</strong> No employer or agency listed on LocalHire may charge job seekers application fees, security deposits, or interview fees.
            </p>
            <p>
              2. <strong>Authentic Listings:</strong> Employers must represent real vacancies located in or serving West Godavari. Misleading listings are removed promptly by platform administrators.
            </p>
          </div>
        </Modal>
      )}

      {activeLegalModal === 'accessibility' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveLegalModal(null)}
          title="Accessibility & Language Commitment"
          subtitle="Inclusive Local Access"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p>
              LocalHire is committed to making local employment accessible to all residents of West Godavari, regardless of English proficiency or device type.
            </p>
            <p>
              We provide full bilingual interface support in <strong>తెలుగు (Telugu)</strong> and <strong>English</strong>.
            </p>
          </div>
        </Modal>
      )}
    </footer>
  );
}
