import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../common/Modal';

export default function SavedJobsModal({
  isOpen,
  onClose,
  savedJobs = [],
  onRemoveSaved,
  onViewDetails
}) {
  const { t } = useLanguage();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modals.savedJobs.title', 'Saved Job Bookmarks')}
      subtitle={`${savedJobs.length} ${t('jobseeker.savedVacancies', 'saved positions')}`}
      maxWidth="680px"
    >
      {savedJobs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {savedJobs.map((job) => (
            <div
              key={job.id}
              style={{
                background: 'rgba(11, 16, 32, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ flex: 1, minWidth: '220px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.25rem' }}>
                  {job.title}
                </h4>
                <div style={{ fontSize: '0.85rem', color: '#A78BFA', fontWeight: 600 }}>
                  🏢 {job.company} • 📍 {job.town}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#34D399', fontWeight: 600, marginTop: '0.35rem' }}>
                  {job.salary || 'Salary Disclosed Upon Request'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  type="button"
                  style={{
                    background: 'rgba(124, 58, 237, 0.15)',
                    border: '1px solid rgba(124, 58, 237, 0.35)',
                    color: '#C4B5FD',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    onClose();
                    onViewDetails(job);
                  }}
                >
                  {t('modals.savedJobs.viewJob', 'View Details')}
                </button>

                <button
                  type="button"
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => onRemoveSaved(job)}
                  title={t('modals.savedJobs.remove', 'Remove')}
                >
                  {t('modals.savedJobs.remove', 'Remove')} ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🤍</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.5rem' }}>
            {t('modals.savedJobs.emptyTitle', 'No Saved Jobs Yet')}
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto' }}>
            {t('modals.savedJobs.emptyDesc', 'Click the heart icon on any job card to save it for quick review and applying later.')}
          </p>
        </div>
      )}
    </Modal>
  );
}
