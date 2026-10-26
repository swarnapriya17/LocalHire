import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { applicationService } from '../../services/api';
import Modal from '../common/Modal';
import styles from './JobDetailsModal.module.css';

export default function JobDetailsModal({ job, isOpen, onClose, isSaved, onToggleSave, onShowToast }) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Reset submission state when opening a different job
    setShowApplyForm(false);
    setIsSubmitted(false);
    setErrorMessage('');
    setCoverLetter('');
    if (user?.jobseekerProfile?.resumeUrl) {
      setResumeUrl(user.jobseekerProfile.resumeUrl);
    } else {
      setResumeUrl('');
    }
  }, [job, isOpen, user]);

  if (!job) return null;

  const jobId = job.id || job._id;
  const isExternal = Boolean(job.applicationUrl && job.applicationUrl.trim());
  const isJobSeeker = user?.role === 'jobseeker';

  const handleExternalApply = () => {
    window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
    if (onShowToast) {
      onShowToast(`Redirecting to external application portal for "${job.title}"...`, 'info');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setErrorMessage(t('modals.jobDetails.loginToApply', 'Please sign in with a Job Seeker account to apply for this opening.'));
      return;
    }
    if (!isJobSeeker) {
      setErrorMessage(t('modals.jobDetails.loginToApply', 'Only candidate accounts with the "jobseeker" role can apply.'));
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const res = await applicationService.submitApplication({
        jobId,
        coverLetter: coverLetter.trim(),
        resumeUrl: resumeUrl.trim(),
      });

      if (res && res.success) {
        setIsSubmitted(true);
        setShowApplyForm(false);
        if (onShowToast) {
          onShowToast(`✓ ${t('jobs.applySuccess', 'Application submitted successfully!')}`, 'success');
        }
      }
    } catch (err) {
      const msg = err.message || 'Could not submit application.';
      setErrorMessage(msg);
      if (onShowToast) {
        onShowToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContent = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
      <button
        type="button"
        className={styles.saveModalBtn}
        onClick={() => onToggleSave(job)}
      >
        <span>{isSaved ? '❤️' : '🤍'}</span>
        <span>{isSaved ? t('modals.jobDetails.savedJob', 'Saved in Bookmarks') : t('modals.jobDetails.saveJob', 'Save Job')}</span>
      </button>

      {isExternal ? (
        <button
          type="button"
          className={styles.applyBtn}
          onClick={handleExternalApply}
        >
          <span>{t('modals.jobDetails.applyExternal', 'Apply on Company Site')} ↗</span>
        </button>
      ) : isSubmitted ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34D399', fontWeight: 700, fontSize: '0.92rem' }}>
          <span>✓</span>
          <span>{t('modals.jobDetails.alreadyApplied', 'Application Confirmed')}</span>
        </div>
      ) : !isAuthenticated ? (
        <Link
          to="/login"
          className={styles.applyBtn}
          style={{ textDecoration: 'none' }}
        >
          {t('modals.jobDetails.loginToApply', 'Sign In as Job Seeker to Apply')} →
        </Link>
      ) : !isJobSeeker ? (
        <span style={{ fontSize: '0.85rem', color: '#FCD34D' }}>
          ℹ️ {user.role} ({t('modals.jobDetails.loginToApply', 'Job seeker account required')})
        </span>
      ) : !showApplyForm ? (
        <button
          type="button"
          className={styles.applyBtn}
          onClick={() => setShowApplyForm(true)}
        >
          <span>{t('modals.jobDetails.applyNow', 'Apply for this Position')} →</span>
        </button>
      ) : null}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={job.title}
      subtitle={`Offered by ${job.company} — ${job.locationDetail || job.town}, ${t('nav.region', 'West Godavari')}`}
      footer={footerContent}
      maxWidth="740px"
    >
      <div className={styles.detailContainer}>
        {/* Application Status Banner if already submitted */}
        {isSubmitted && (
          <div className={styles.successBanner}>
            <span style={{ fontSize: '1.25rem' }}>🎉</span>
            <div>
              <strong>{t('modals.jobDetails.successTitle', 'Application Submitted!')}</strong> {t('modals.jobDetails.successDesc', 'Your candidate profile and application have been transmitted to the employer.')}
            </div>
          </div>
        )}

        {/* Interactive Apply Form */}
        {showApplyForm && !isSubmitted && (
          <form className={styles.applyFormSection} onSubmit={handleFormSubmit}>
            <div className={styles.applyFormTitle}>
              <span>📝</span> {t('modals.jobDetails.submitApplication', 'Submit Application')} — {job.title}
            </div>

            <div style={{ fontSize: '0.82rem', color: '#94A3B8', background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: 8 }}>
              {t('common.status', 'Applying as')}: <strong style={{ color: '#F8FAFC' }}>{user?.name}</strong> ({user?.email}) • {t('nav.region', 'West Godavari')}
            </div>

            {errorMessage && (
              <div className={styles.errorBanner}>
                ⚠️ {errorMessage}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="app-cover-letter" className={styles.formLabel}>
                {t('modals.jobDetails.coverLetter', 'Cover Letter / Candidate Note')} ({t('common.optional', 'Optional')})
              </label>
              <textarea
                id="app-cover-letter"
                className={styles.formTextarea}
                placeholder={t('modals.jobDetails.coverLetterPlaceholder', 'Explain why you are interested in this position in West Godavari, relevant skills, or why you are a great regional fit...')}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                maxLength={2500}
                rows={4}
              />
              <span className={styles.infoNote}>
                {coverLetter.length} / 2500
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="app-resume-url" className={styles.formLabel}>
                {t('modals.jobDetails.resumeUrl', 'Resume / Portfolio Document Link')} ({t('common.optional', 'Optional')})
              </label>
              <input
                id="app-resume-url"
                type="url"
                className={styles.formInput}
                placeholder={t('modals.jobDetails.resumeUrlPlaceholder', 'https://drive.google.com/... or https://portfolio.dev')}
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setShowApplyForm(false);
                  setErrorMessage('');
                }}
                disabled={isSubmitting}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className={styles.applyBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('modals.jobDetails.submitting', 'Submitting Application...') : `${t('modals.jobDetails.submitApplication', 'Confirm & Submit Application')} 🚀`}
              </button>
            </div>
          </form>
        )}

        {/* Quick Meta Grid */}
        <div className={styles.metaGrid}>
          <div className={styles.metaBlock}>
            <span className={styles.metaLabel}>{t('profile.locationLabel', 'Location')}</span>
            <span className={styles.metaValue}>📍 {job.town}, AP</span>
          </div>

          <div className={styles.metaBlock}>
            <span className={styles.metaLabel}>{t('profile.employmentTypeLabel', 'Employment Type')}</span>
            <span className={styles.metaValue}>💼 {job.employmentType}</span>
          </div>

          <div className={styles.metaBlock}>
            <span className={styles.metaLabel}>{t('jobs.experienceLevel', 'Experience Level')}</span>
            <span className={styles.metaValue}>⏱️ {job.experience}</span>
          </div>

          <div className={styles.metaBlock}>
            <span className={styles.metaLabel}>{t('jobs.salaryRange', 'Salary / Compensation')}</span>
            <span className={styles.metaValue} style={{ color: '#34D399' }}>
              💰 {job.salary || 'Competitive'}
            </span>
          </div>
        </div>

        {/* Overview */}
        <div className={styles.sectionBlock}>
          <h4 className={styles.blockTitle}>
            <span>📋</span> {t('common.view', 'Role Overview')}
          </h4>
          <p className={styles.textParagraph}>{job.description}</p>
        </div>

        {/* Responsibilities */}
        {job.responsibilities && (
          <div className={styles.sectionBlock}>
            <h4 className={styles.blockTitle}>
              <span>🎯</span> {t('jobs.responsibilities', 'Key Responsibilities')}
            </h4>
            <ul className={styles.bulletsList}>
              {job.responsibilities.map((resp, idx) => (
                <li key={idx} className={styles.bulletItem}>
                  <span className={styles.bulletDot}>•</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div className={styles.sectionBlock}>
            <h4 className={styles.blockTitle}>
              <span>🎓</span> {t('jobs.requirements', 'Candidate Requirements & Qualifications')}
            </h4>
            <ul className={styles.bulletsList}>
              {job.requirements.map((req, idx) => (
                <li key={idx} className={styles.bulletItem}>
                  <span className={styles.bulletDot}>•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Perks & Benefits */}
        {job.perks && (
          <div className={styles.sectionBlock}>
            <h4 className={styles.blockTitle}>
              <span>✨</span> {t('jobs.perks', 'Perks & Benefits')}
            </h4>
            <div className={styles.perksGrid}>
              {job.perks.map((perk, idx) => (
                <span key={idx} className={styles.perkPill}>
                  ✓ {perk}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
