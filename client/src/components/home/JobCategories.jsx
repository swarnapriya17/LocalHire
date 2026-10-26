import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { categoriesData } from '../../data/categoriesData';
import styles from './JobCategories.module.css';

export default function JobCategories({ selectedCategory, onSelectCategory }) {
  const { t } = useLanguage();

  const handleCardClick = (catId) => {
    if (onSelectCategory) {
      // Toggle category if clicked again
      onSelectCategory(selectedCategory === catId ? 'all' : catId);
    }
    const jobsElem = document.getElementById('jobs');
    if (jobsElem) {
      jobsElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.sectionWrapper} id="categories">
      <div className={styles.headerRow}>
        <div className={styles.sectionBadge}>
          <span>📑</span> {t('nav.categories', 'Career Sectors')}
        </div>
        <h2 className={styles.sectionTitle}>{t('jobs.allCategories', 'Explore by Industry Sector')}</h2>
        <p className={styles.sectionSubtitle}>
          {t('jobs.subtitle', 'From high-growth tech positions to foundational agro-industry, education, and healthcare roles across West Godavari.')}
        </p>
      </div>

      <div className={styles.categoryGrid}>
        {categoriesData.map((category) => {
          const isActive = selectedCategory === category.id;
          return (
            <div
              key={category.id}
              className={`${styles.categoryCard} ${isActive ? styles.categoryActive : ''}`}
              onClick={() => handleCardClick(category.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(category.id);
                }
              }}
              aria-label={`Filter jobs by category: ${category.title}`}
            >
              <div className={styles.topRow}>
                <div className={styles.iconWrapper}>
                  {category.icon}
                </div>
                <span className={styles.jobCountPill}>
                  {category.count} {t('common.view', 'Openings')}
                </span>
              </div>

              <div>
                <h3 className={styles.categoryTitle}>{category.title}</h3>
                <p className={styles.categoryDesc}>{category.description}</p>
              </div>

              <div className={styles.cardFooter}>
                <span>{isActive ? 'Active Filter ✓' : `${t('common.view', 'View Positions')}`}</span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
