import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './FresherSection.module.css';

export default function FresherSection({ onFilterFreshers, onSelectJob }) {
  const { t } = useLanguage();

  const fresherHighlights = [
    {
      id: 'job-1',
      title: 'Junior Frontend Developer (React)',
      company: 'Godavari Digital Solutions',
      town: 'Bhimavaram',
      type: 'Full-time / Hybrid',
      stipend: '₹3.2 - ₹4.5 LPA'
    },
    {
      id: 'job-11',
      title: 'Graduate Trainee - Embedded Systems',
      company: 'Delta IoT Solutions (NIT AP Incubated)',
      town: 'Tadepalligudem',
      type: 'Internship / Full-time',
      stipend: '₹18,000 / mo Stipend'
    },
    {
      id: 'job-3',
      title: 'Assistant Branch Accountant',
      company: 'Godavari Rural Credit Cooperative',
      town: 'Eluru',
      type: 'Full-time Banking',
      stipend: '₹18,000 - ₹25,000 / mo'
    },
    {
      id: 'job-12',
      title: 'Customer Relationship Associate',
      company: 'Godavari Commercial Bank',
      town: 'Bhimavaram',
      type: 'Full-time Retail Banking',
      stipend: '₹2.8 - ₹3.4 LPA'
    }
  ];

  const handleCardClick = (jobId) => {
    if (onSelectJob) {
      onSelectJob(jobId);
    }
  };

  return (
    <section className={styles.sectionWrapper} id="freshers">
      <div className={styles.boxContainer}>
        <div className={styles.headerRow}>
          <div>
            <div className={styles.badge}>
              <span>🎓</span> {t('freshers.badge', 'Early Career Launchpad')}
            </div>
            <h2 className={styles.title}>{t('freshers.title', 'Fresher & Entry-Level Opportunities')}</h2>
            <p className={styles.subtitle}>
              {t('freshers.subtitle', 'Kickstart your career locally without relocation hurdles. Designed for 2024, 2025, and 2026 graduates across engineering, commerce, arts, and science colleges in West Godavari.')}
            </p>
          </div>
        </div>

        {/* 4 Pillars */}
        <div className={styles.advantageGrid}>
          <div className={styles.advantageCard}>
            <span className={styles.advIcon}>🌱</span>
            <div className={styles.advTitle}>{t('freshers.benefit1Title', 'Zero Relocation Burden')}</div>
            <p className={styles.advDesc}>{t('freshers.benefit1Desc', 'Start earning right away without metro living expenses in Hyderabad or Bangalore.')}</p>
          </div>

          <div className={styles.advantageCard}>
            <span className={styles.advIcon}>🤝</span>
            <div className={styles.advTitle}>{t('freshers.benefit2Title', 'Practical Mentorship')}</div>
            <p className={styles.advDesc}>{t('freshers.benefit2Desc', 'Structured on-the-job guidance from established Godavari businesses and tech incubators.')}</p>
          </div>

          <div className={styles.advantageCard}>
            <span className={styles.advIcon}>💰</span>
            <div className={styles.advTitle}>{t('freshers.benefit3Title', 'Fast-Track Evaluation')}</div>
            <p className={styles.advDesc}>{t('freshers.benefit3Desc', 'Academic projects and college credentials are fully recognized without prior work experience.')}</p>
          </div>

          <div className={styles.advantageCard}>
            <span className={styles.advIcon}>📍</span>
            <div className={styles.advTitle}>{t('nav.region', 'West Godavari')}</div>
            <p className={styles.advDesc}>{t('hero.subDescription', 'Empowering fresh graduates, skilled professionals, and local enterprises.')}</p>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className={styles.fresherGrid}>
          {fresherHighlights.map((fh) => (
            <div key={fh.id} className={styles.fresherCard}>
              <div>
                <h3 className={styles.fresherRole}>{fh.title}</h3>
                <div className={styles.fresherCompany}>{fh.company}</div>
                <div className={styles.fresherMeta}>
                  <span>📍 {fh.town}</span>
                  <span>•</span>
                  <span>{fh.type}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className={styles.fresherStipend}>{fh.stipend}</span>
                <button
                  type="button"
                  className={styles.viewFresherBtn}
                  onClick={() => handleCardClick(fh.id)}
                >
                  <span>{t('common.view', 'Details')}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Row */}
        <div className={styles.fresherCtaRow}>
          <button
            type="button"
            className={styles.allFreshersBtn}
            onClick={onFilterFreshers}
          >
            <span>🎓</span> {t('freshers.filterAllBtn', 'View All Fresher & Trainee Vacancies')}
          </button>
        </div>
      </div>
    </section>
  );
}
