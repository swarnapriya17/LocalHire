import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../common/Modal';
import { careerResources } from '../../data/resourcesData';
import styles from './CareerResources.module.css';

export default function CareerResources({ onShowToast }) {
  const { t } = useLanguage();
  const [activeResource, setActiveResource] = useState(null);

  const handleOpenResource = (res) => {
    setActiveResource(res);
  };

  const handleBookmarkResource = () => {
    if (onShowToast) {
      onShowToast(t('resources.bookmarkNotice', 'Guide bookmarked for offline reference.'), 'success');
    }
    setActiveResource(null);
  };

  return (
    <section className={styles.sectionWrapper} id="resources">
      <div className={styles.headerRow}>
        <div className={styles.sectionBadge}>
          <span>📚</span> {t('resources.badge', 'Knowledge Center')}
        </div>
        <h2 className={styles.sectionTitle}>{t('resources.title', 'Career Development & Playbooks')}</h2>
        <p className={styles.sectionSubtitle}>
          {t('resources.subtitle', 'Expert advice tailored to job seekers in Andhra Pradesh, covering ATS resumes, interviews, high-demand skills, and campus transition.')}
        </p>
      </div>

      <div className={styles.grid}>
        {careerResources.map((res) => (
          <article key={res.id} className={styles.card}>
            <div>
              <div className={styles.topMeta}>
                <span className={styles.categoryTag}>{res.tag}</span>
                <span className={styles.readTime}>{res.readTime}</span>
              </div>

              <div className={styles.icon}>{res.icon}</div>
              <h3 className={styles.title}>{res.title}</h3>
              <p className={styles.summary}>{res.summary}</p>
            </div>

            <button
              type="button"
              className={styles.readBtn}
              onClick={() => handleOpenResource(res)}
              aria-label={`Read guide: ${res.title}`}
            >
              <span>{t('resources.readPlaybook', 'Read Full Playbook')}</span>
              <span>→</span>
            </button>
          </article>
        ))}
      </div>

      {/* Guide Details Modal */}
      {activeResource && (
        <Modal
          isOpen={Boolean(activeResource)}
          onClose={() => setActiveResource(null)}
          title={activeResource.title}
          subtitle={`${activeResource.category} • ${activeResource.readTime}`}
          maxWidth="720px"
          footer={
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E1EDF3',
                  color: '#17365D',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                onClick={handleBookmarkResource}
              >
                {t('common.save', 'Bookmark Guide')} 🔖
              </button>
              <button
                type="button"
                style={{
                  background: 'var(--primary-teal)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.65rem 1.5rem',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(15, 157, 150, 0.25)',
                }}
                onClick={() => setActiveResource(null)}
              >
                {t('common.close', 'Done Reading')}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Key Takeaways Box */}
            <div style={{ background: '#F3EFFF', border: '1px solid #DDD6FE', borderRadius: 10, padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                💡 Key Actionable Takeaways
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeResource.keyPoints.map((point, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem', color: '#17365D', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--primary-teal)', fontWeight: 700 }}>✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Content */}
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#17365D', marginBottom: '0.75rem' }}>
                In-Depth Guide
              </h4>
              <div style={{ color: '#526B85', fontSize: '0.94rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {activeResource.detailedContent}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
