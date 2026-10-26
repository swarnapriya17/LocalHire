import React, { useState, useMemo } from 'react';
import JobCard from './JobCard';
import JobDetailsModal from './JobDetailsModal';
import { categoriesData } from '../../data/categoriesData';
import { WEST_GODAVARI_LOCATIONS } from './HeroSection';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './JobSection.module.css';

export default function JobSection({
  jobs = [],
  savedJobIds = [],
  onToggleSave,
  searchKeyword = '',
  onKeywordChange,
  selectedLocation = 'all',
  onLocationChange,
  selectedCategory = 'all',
  onCategoryChange,
  onShowToast,
  isLoading = false,
  onRefresh,
}) {
  const { t } = useLanguage();
  const [experienceFilter, setExperienceFilter] = useState('all'); // 'all' | 'fresher' | 'experienced'
  const [selectedJob, setSelectedJob] = useState(null);

  // Filter jobs based on criteria
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Keyword search (title, company, description, town)
      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase().trim();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.company.toLowerCase().includes(query);
        const matchesTown = job.town.toLowerCase().includes(query);
        const matchesDesc = job.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany && !matchesTown && !matchesDesc) {
          return false;
        }
      }

      // 2. Location filter
      if (selectedLocation !== 'all') {
        if (job.town.toLowerCase() !== selectedLocation.toLowerCase()) {
          return false;
        }
      }

      // 3. Category filter
      if (selectedCategory !== 'all') {
        if (job.category !== selectedCategory) {
          return false;
        }
      }

      // 4. Experience filter
      if (experienceFilter === 'fresher') {
        if (!job.isFresher) return false;
      } else if (experienceFilter === 'experienced') {
        if (job.isFresher) return false;
      }

      return true;
    });
  }, [jobs, searchKeyword, selectedLocation, selectedCategory, experienceFilter]);

  const handleResetFilters = () => {
    if (onKeywordChange) onKeywordChange('');
    if (onLocationChange) onLocationChange('all');
    if (onCategoryChange) onCategoryChange('all');
    setExperienceFilter('all');
    if (onShowToast) {
      onShowToast('Job filters reset to default view.', 'info');
    }
  };

  return (
    <section className={styles.sectionWrapper} id="jobs">
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={styles.sectionBadge}>
            <span>💼</span> {t('jobs.verifiedEmployer', 'Verified Opportunities')}
          </div>
          <h2 className={styles.sectionTitle}>{t('jobs.title', 'Latest Local Vacancies')}</h2>
          <p className={styles.sectionSubtitle}>
            {t('jobs.subtitle', 'Browse active employment openings across technology, healthcare, education, retail, and manufacturing in West Godavari.')}
          </p>
        </div>
      </div>

      {/* Honest Demo Notification Banner */}
      <div className={styles.demoBanner}>
        <div className={styles.demoBannerLeft}>
          <span className={styles.demoTag}>Demo Dataset Notice</span>
          <span>
            {t('common.dbUnavailable', 'The jobs listed below are illustrative preview postings for platform demonstration. Real verified vacancies will be populated once employer onboarding opens.')}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={styles.filterToolbar}>
        <div className={styles.filterControlsRow}>
          {/* Keyword Search */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel} htmlFor="job-keyword-filter">{t('common.search', 'Search Keywords')}</label>
            <input
              id="job-keyword-filter"
              type="text"
              className={styles.filterInput}
              placeholder={t('jobs.searchPlaceholder', 'Filter by title or skills...')}
              value={searchKeyword}
              onChange={(e) => onKeywordChange(e.target.value)}
            />
          </div>

          {/* Location Select */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel} htmlFor="job-location-filter">{t('jobs.allLocations', 'Mandal / Town')}</label>
            <select
              id="job-location-filter"
              className={styles.filterSelect}
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
            >
              {WEST_GODAVARI_LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel} htmlFor="job-category-filter">{t('nav.categories', 'Career Sector')}</label>
            <select
              id="job-category-filter"
              className={styles.filterSelect}
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="all">{t('jobs.allCategories', 'All Sectors')} ({jobs.length})</option>
              {categoriesData.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Filter */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel} htmlFor="job-exp-filter">{t('jobs.experienceLevel', 'Experience Level')}</label>
            <select
              id="job-exp-filter"
              className={styles.filterSelect}
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
            >
              <option value="all">{t('common.all', 'All Experience Levels')}</option>
              <option value="fresher">{t('jobs.fresherFriendly', 'Fresher / 0-1 Yr Friendly')}</option>
              <option value="experienced">Experienced (1+ Yrs)</option>
            </select>
          </div>
        </div>

        {/* Filter Meta & Reset */}
        <div className={styles.filterMetaRow}>
          <div className={styles.resultsCount}>
            Showing <strong>{filteredJobs.length}</strong> of {jobs.length} demo job postings
            {selectedCategory !== 'all' && ` in "${categoriesData.find(c => c.id === selectedCategory)?.title || selectedCategory}"`}
            {selectedLocation !== 'all' && ` around ${selectedLocation}`}
          </div>

          {(searchKeyword || selectedLocation !== 'all' || selectedCategory !== 'all' || experienceFilter !== 'all') && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleResetFilters}
            >
              Reset All Filters ✕
            </button>
          )}
        </div>
      </div>

      {/* Jobs Grid or Loading State */}
      {isLoading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#A78BFA' }}>
          <div 
            style={{
              width: '42px',
              height: '42px',
              border: '3px solid rgba(124, 58, 237, 0.25)',
              borderTopColor: '#7C3AED',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 0.8s linear infinite'
            }} 
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading latest West Godavari vacancies...</div>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className={styles.jobGrid}>
          {filteredJobs.map((job, idx) => {
            const jobId = job.id || job._id;
            return (
              <JobCard
                key={jobId}
                index={idx}
                job={job}
                isSaved={savedJobIds.includes(jobId)}
                onToggleSave={onToggleSave}
                onViewDetails={(j) => setSelectedJob(j)}
              />
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3 className={styles.emptyTitle}>No matching jobs found</h3>
          <p className={styles.emptyText}>
            We couldn't find any job postings matching your exact search filters. Try widening your criteria or clearing filters.
          </p>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleResetFilters}
            style={{ fontSize: '0.95rem' }}
          >
            Clear Search Filters
          </button>
        </div>
      )}

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        isSaved={selectedJob ? savedJobIds.includes(selectedJob.id || selectedJob._id) : false}
        onToggleSave={onToggleSave}
        onShowToast={onShowToast}
      />
    </section>
  );
}
