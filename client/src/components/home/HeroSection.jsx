import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './HeroSection.module.css';

const QUICK_SEARCHES = [
  'Full-Stack Developer',
  'Fresher / Trainee',
  'Accounts & Finance',
  'Aqua & Agro Tech',
  'Retail Store Lead',
  'Healthcare & Nursing'
];

export const WEST_GODAVARI_LOCATIONS = [
  { value: 'all', label: 'All West Godavari Mandals' },
  { value: 'Bhimavaram', label: 'Bhimavaram' },
  { value: 'Eluru', label: 'Eluru' },
  { value: 'Tadepalligudem', label: 'Tadepalligudem' },
  { value: 'Tanuku', label: 'Tanuku' },
  { value: 'Palakollu', label: 'Palakollu' },
  { value: 'Narsapur', label: 'Narsapur' },
  { value: 'Jangareddygudem', label: 'Jangareddygudem' }
];

export default function HeroSection({ onSearch, onPostJobClick, onExploreClick, isRevealed = true }) {
  const { t } = useLanguage();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('all');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ keyword: keyword.trim(), location });
    }
    const jobsElem = document.getElementById('jobs');
    if (jobsElem) {
      jobsElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickTagClick = (tag) => {
    setKeyword(tag);
    if (onSearch) {
      onSearch({ keyword: tag, location });
    }
    const jobsElem = document.getElementById('jobs');
    if (jobsElem) {
      jobsElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.heroWrapper} id="hero">
      <div className={styles.heroContent}>
        {/* District Highlight Badge */}
        <div className={`${styles.districtBadge} ${isRevealed ? styles.staggerBadge : ''}`}>
          <span className={styles.badgeDot}></span>
          {t('hero.badge', 'West Godavari Employment Network')}
        </div>

        {/* Headlines: "Local Jobs. Limitless Opportunities." with Limitless in Teal and Opportunities in Lavender */}
        <h1 className={`${styles.mainTitle} ${isRevealed ? styles.staggerTitle : ''}`}>
          <span className={styles.titleMain}>{t('hero.titleLight', 'Local Jobs.')} </span>
          <span className={styles.titleTeal}>{t('hero.titleLimitless', 'Limitless')} </span>
          <span className={styles.titleLavender}>{t('hero.titleOpportunities', 'Opportunities.')}</span>
        </h1>

        <p className={`${styles.subDescription} ${isRevealed ? styles.staggerDesc : ''}`}>
          {t('hero.subDescription', 'The dedicated employment portal connecting regional talent with verified employers across Bhimavaram, Eluru, Tadepalligudem, Tanuku, Palakollu, and surrounding mandals. Empowering fresh graduates, skilled professionals, and local enterprises.')}
        </p>

        {/* Prominent White Search Interface */}
        <div className={`${styles.searchBoxContainer} ${isRevealed ? styles.staggerSearch : ''}`}>
          <form className={styles.searchForm} onSubmit={handleSubmit} role="search">
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={t('hero.searchPlaceholder', 'Job title, skills, or company (e.g. React, Accountant, Nurse)...')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="Job keyword search"
              />
            </div>

            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>📍</span>
              <select
                className={styles.locationSelect}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Filter jobs by West Godavari location"
              >
                {WEST_GODAVARI_LOCATIONS.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.value === 'all' ? t('hero.allLocations', loc.label) : loc.label}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className={styles.searchSubmitBtn}>
              <span>{t('hero.searchBtn', 'Search Jobs')}</span>
              <span>→</span>
            </button>
          </form>
        </div>

        {/* Suggested Searches & Rounded Light-Teal Chips */}
        <div className={`${styles.quickFiltersWrapper} ${isRevealed ? styles.staggerQuick : ''}`}>
          <span className={styles.quickLabel}>{t('hero.popularSearches', 'Popular Searches:')}</span>
          <div className={styles.quickTagsList}>
            {QUICK_SEARCHES.map((tag) => (
              <button
                key={tag}
                type="button"
                className={styles.quickTag}
                onClick={() => handleQuickTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className={`${styles.heroCtaRow} ${isRevealed ? styles.staggerCta : ''}`}>
          <button 
            type="button" 
            className={styles.primaryCta}
            onClick={onExploreClick}
          >
            <span>💼</span> {t('hero.exploreCta', 'Explore Latest Vacancies')}
          </button>
          
          <button 
            type="button" 
            className={styles.secondaryCta}
            onClick={onPostJobClick}
          >
            <span>🏢</span> {t('hero.employerCta', 'Verified Employer Registration')}
          </button>
        </div>
      </div>
    </section>
  );
}
