import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './JobCard.module.css';

export default function JobCard({ job, isSaved, onToggleSave, onViewDetails, index = 0 }) {
  const { t } = useLanguage();

  return (
    <article 
      className={`${styles.card} ${styles.cardEntrance}`} 
      style={{ animationDelay: `${Math.min(index * 65, 450)}ms` }}
      aria-label={`Job listing: ${job.title} at ${job.company}`}
    >
      <div>
        <div className={styles.cardTop}>
          <div className={styles.badgeRow}>
            <span className={styles.demoBadge} title="Verified status">
              {job.verificationStatus}
            </span>
            {job.isFresher && (
              <span className={styles.fresherBadge}>
                🎓 {t('jobs.fresherFriendly', 'Fresher Friendly')}
              </span>
            )}
          </div>

          <button
            type="button"
            className={`${styles.saveButton} ${isSaved ? styles.savedActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(job);
            }}
            aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
            title={isSaved ? t('modals.jobDetails.savedJob', 'Job saved') : t('modals.jobDetails.saveJob', 'Save job')}
          >
            {isSaved ? '❤️' : '🤍'}
          </button>
        </div>

        <h3 
          className={styles.jobTitle} 
          onClick={() => onViewDetails(job)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onViewDetails(job);
          }}
        >
          {job.title}
        </h3>

        <div className={styles.companyName}>
          <span>🏢</span>
          <span>{job.company}</span>
        </div>

        <div className={styles.metaList}>
          <span className={styles.metaItem}>
            <span>📍</span>
            <span className={styles.metaHighlight}>{job.town}</span>
          </span>
          <span className={styles.metaItem}>
            <span>💼</span>
            <span>{job.employmentType}</span>
          </span>
          <span className={styles.metaItem}>
            <span>⏱️</span>
            <span>{job.experience}</span>
          </span>
        </div>

        <p className={styles.shortSnippet}>{job.description}</p>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.salaryText}>
          {job.salary || 'Salary Disclosed Upon Request'}
        </div>

        <button
          type="button"
          className={styles.viewDetailsBtn}
          onClick={() => onViewDetails(job)}
        >
          <span>{t('common.view', 'View Details')}</span>
          <span>→</span>
        </button>
      </div>
    </article>
  );
}
