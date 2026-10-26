import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../common/Modal';
import { mockEmployers } from '../../data/mockEmployers';
import styles from './EmployerShowcase.module.css';

export default function EmployerShowcase({ onOpenPostJob }) {
  const { t } = useLanguage();
  const [activeEmployer, setActiveEmployer] = useState(null);

  return (
    <section className={styles.sectionWrapper} id="employers">
      <div className={styles.headerRow}>
        <div className={styles.sectionBadge}>
          <span>🏢</span> {t('employers.badge', 'Regional Employers')}
        </div>
        <h2 className={styles.sectionTitle}>{t('employers.title', 'Partnering with Godavari Enterprises')}</h2>
        <p className={styles.sectionSubtitle}>
          {t('employers.subtitle', 'From emerging technology centers in Bhimavaram to established agricultural manufacturing plants in Tanuku and healthcare networks in Eluru.')}
        </p>
      </div>

      <div className={styles.disclaimerBanner}>
        ⚠️ <strong>{t('common.notes', 'Notice')}:</strong> {t('employers.disclaimer', 'Company profiles displayed below are illustrative partner previews created to demonstrate directory layout.')}
      </div>

      <div className={styles.grid}>
        {mockEmployers.map((emp) => (
          <div key={emp.id} className={styles.card}>
            <div>
              <div className={styles.cardHeader}>
                <div 
                  className={styles.logoPill} 
                  style={{ borderColor: emp.accentColor, color: emp.accentColor }}
                >
                  {emp.logoText}
                </div>
                <div className={styles.headerText}>
                  <h3 className={styles.companyName}>{emp.name}</h3>
                  <div className={styles.townLocation}>
                    <span>📍</span> {emp.town}, {t('nav.region', 'West Godavari')}
                  </div>
                </div>
              </div>

              <div className={styles.sectorTag}>{emp.sector}</div>
              <p className={styles.tagline}>"{emp.tagline}"</p>
            </div>

            <div>
              <div className={styles.metaRow}>
                <span>{t('employers.team', 'Team:')} {emp.employeeCount}</span>
                <span className={styles.openingsPill}>{emp.sampleOpenings} {t('employers.openings', 'Demo Roles')}</span>
              </div>

              <button
                type="button"
                className={styles.profileBtn}
                onClick={() => setActiveEmployer(emp)}
              >
                <span>{t('employers.viewOverview', 'View Company Overview')}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Callout Card */}
      <div className={styles.calloutBox}>
        <div className={styles.calloutLeft}>
          <h3 className={styles.calloutTitle}>{t('modals.postJob.title', 'Are You an Employer in West Godavari?')}</h3>
          <p className={styles.calloutDesc}>
            {t('modals.postJob.subtitle', 'Connect with verified local graduates, IT talent, and skilled tradesmen. Post vacancies directly to candidates who live and want to work in your region.')}
          </p>
        </div>
        <button
          type="button"
          className={styles.registerEmployerBtn}
          onClick={onOpenPostJob}
        >
          <span>💼</span> {t('modals.postJob.registerBtn', 'Register as an Employer')}
        </button>
      </div>

      {/* Employer Details Modal */}
      {activeEmployer && (
        <Modal
          isOpen={Boolean(activeEmployer)}
          onClose={() => setActiveEmployer(null)}
          title={activeEmployer.name}
          subtitle={`${activeEmployer.sector} — ${activeEmployer.town}, AP`}
          maxWidth="640px"
          footer={
            <button
              type="button"
              className={styles.registerEmployerBtn}
              onClick={() => {
                setActiveEmployer(null);
                onOpenPostJob();
              }}
            >
              {t('nav.postJob', 'Post a Job')} ({activeEmployer.town})
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.85rem', borderRadius: 8, fontSize: '0.85rem', color: '#92400E' }}>
              ℹ️ <strong>{t('common.notes', 'Notice')}:</strong> {t('employers.disclaimer', 'This profile is an illustrative mockup.')}
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {t('common.view', 'About the Organization')}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                {activeEmployer.about}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>{t('profile.locationLabel', 'Headquarters')}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{activeEmployer.town}, {t('nav.region', 'West Godavari')}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>{t('employers.team', 'Company Size')}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{activeEmployer.employeeCount}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
