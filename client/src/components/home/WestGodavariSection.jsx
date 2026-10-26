import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { westGodavariTowns } from '../../data/townsData';
import styles from './WestGodavariSection.module.css';

export default function WestGodavariSection({ selectedLocation, onSelectTown }) {
  const { t } = useLanguage();

  const handleTownClick = (townName) => {
    if (onSelectTown) {
      onSelectTown(selectedLocation === townName ? 'all' : townName);
    }
    const jobsElem = document.getElementById('jobs');
    if (jobsElem) {
      jobsElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.sectionWrapper} id="regions">
      <div className={styles.headerRow}>
        <div className={styles.sectionBadge}>
          <span>🗺️</span> {t('regions.badge', 'Regional Employment Hubs')}
        </div>
        <h2 className={styles.sectionTitle}>{t('regions.title', 'West Godavari Employment Clusters')}</h2>
        <p className={styles.sectionSubtitle}>
          {t('regions.subtitle', 'Discover career opportunities localized to specific towns, educational clusters, and industrial corridors across West Godavari.')}
        </p>
      </div>

      <div className={styles.townGrid}>
        {westGodavariTowns.map((town) => {
          const isActive = selectedLocation.toLowerCase() === town.name.toLowerCase();
          return (
            <div
              key={town.id}
              className={`${styles.townCard} ${isActive ? styles.townActive : ''}`}
              onClick={() => handleTownClick(town.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTownClick(town.name);
                }
              }}
              aria-label={`View jobs in ${town.name}`}
            >
              <div>
                <div className={styles.townTop}>
                  <h3 className={styles.townName}>
                    <span>📍</span> {town.name}
                  </h3>
                  {town.isPopular && (
                    <span style={{ fontSize: '0.72rem', background: 'rgba(124, 58, 237, 0.2)', color: '#C4B5FD', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 700 }}>
                      {t('regions.majorHub', 'Major Hub')}
                    </span>
                  )}
                </div>

                <div className={styles.hubType}>{town.type}</div>

                <div className={styles.sectorTagWrapper}>
                  {town.keySectors.map((sector, idx) => (
                    <span key={idx} className={styles.sectorPill}>
                      {sector}
                    </span>
                  ))}
                </div>

                <div className={styles.popularRolesBox}>
                  <strong>{t('jobs.responsibilities', 'Sample Roles')}:</strong> {town.popularRoles}
                </div>
              </div>

              <div className={styles.townFooter}>
                <span>{isActive ? 'Filtered in Listings ✓' : `${t('regions.viewJobsIn', 'Explore')} ${town.name}`}</span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
