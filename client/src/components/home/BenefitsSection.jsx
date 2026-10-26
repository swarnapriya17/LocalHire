import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './BenefitsSection.module.css';

export default function BenefitsSection() {
  const { t } = useLanguage();

  const benefits = [
    {
      id: 'verified',
      icon: '🛡️',
      title: t('benefits.verifiedEmployersTitle', 'Verified Regional Employers'),
      desc: t('benefits.verifiedEmployersDesc', 'Pre-screened local enterprises, hospitals, colleges & tech firms ensure genuine, legitimate job offers.'),
      tag: '100% Authentic',
      pillColor: 'teal',
    },
    {
      id: 'local',
      icon: '📍',
      title: t('benefits.localOpportunitiesTitle', 'Hyper-Local Opportunities'),
      desc: t('benefits.localOpportunitiesDesc', 'Work in Bhimavaram, Eluru, Tadepalligudem, Tanuku, Palakollu & Narsapur without metro living expenses.'),
      tag: 'West Godavari',
      pillColor: 'lavender',
    },
    {
      id: 'growth',
      icon: '🚀',
      title: t('benefits.careerGrowthTitle', 'Accelerated Career Growth'),
      desc: t('benefits.careerGrowthDesc', 'Dedicated launchpad for fresh graduates with project recognition, skill-gap paths, and direct interviews.'),
      tag: 'Fresher First',
      pillColor: 'teal',
    },
    {
      id: 'support',
      icon: '🤝',
      title: t('benefits.supportTitle', 'Bilingual Support & AI Prep'),
      desc: t('benefits.supportDesc', 'Seamless English & Telugu interface with AI resume review, STAR interview practice, and live tracking.'),
      tag: 'English + తెలుగు',
      pillColor: 'lavender',
    },
  ];

  return (
    <section className={styles.sectionWrapper} id="benefits">
      <div className={styles.headerRow}>
        <div className={styles.sectionBadge}>
          <span>✨</span> {t('benefits.badge', 'Why LocalHire')}
        </div>
        <h2 className={styles.sectionTitle}>
          {t('benefits.title', 'Connecting West Godavari with Limitless Opportunities')}
        </h2>
        <p className={styles.sectionSubtitle}>
          {t('benefits.subtitle', 'Built from the ground up for our district’s employers, graduates, and skilled professionals.')}
        </p>
      </div>

      <div className={styles.grid}>
        {benefits.map((b) => (
          <div key={b.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconWrapper} ${b.pillColor === 'lavender' ? styles.iconLavender : styles.iconTeal}`}>
                {b.icon}
              </div>
              <span className={`${styles.tagPill} ${b.pillColor === 'lavender' ? styles.tagLavender : styles.tagTeal}`}>
                {b.tag}
              </span>
            </div>
            <h3 className={styles.cardTitle}>{b.title}</h3>
            <p className={styles.cardDesc}>{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
