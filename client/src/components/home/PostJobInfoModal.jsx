import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { jobService } from '../../services/api';

export default function PostJobInfoModal({ isOpen, onClose, onShowToast, onJobCreated }) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    title: '',
    company: user?.recruiterProfile?.companyName || user?.name || '',
    town: 'Bhimavaram',
    locationDetail: '',
    category: 'it-software',
    employmentType: 'Full-time',
    workMode: 'On-site',
    experience: 'Fresher / 0 - 1 Year',
    isFresher: false,
    salary: '₹3.0 - ₹4.5 LPA',
    description: '',
    requirements: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.title.trim().length < 3) {
      setErrorMessage('Job title must be at least 3 characters long.');
      return;
    }

    if (formData.company.trim().length < 2) {
      setErrorMessage('Company or business name is required.');
      return;
    }

    if (formData.description.trim().length < 20) {
      setErrorMessage('Job description must be at least 20 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        town: formData.town,
        locationDetail: formData.locationDetail.trim(),
        category: formData.category,
        employmentType: formData.employmentType,
        workMode: formData.workMode,
        experience: formData.experience.trim(),
        isFresher: formData.isFresher || formData.category === 'fresher-opportunities',
        salary: formData.salary.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements
          ? formData.requirements.split('\n').map((r) => r.trim()).filter(Boolean)
          : [],
      };

      const res = await jobService.createJob(payload);

      if (onShowToast) {
        onShowToast(`✓ Opening "${formData.title}" published successfully!`, 'success');
      }

      if (onJobCreated) {
        onJobCreated(res.job);
      }

      // Reset form
      setFormData({
        title: '',
        company: user?.recruiterProfile?.companyName || user?.name || '',
        town: 'Bhimavaram',
        locationDetail: '',
        category: 'it-software',
        employmentType: 'Full-time',
        workMode: 'On-site',
        experience: 'Fresher / 0 - 1 Year',
        isFresher: false,
        salary: '₹3.0 - ₹4.5 LPA',
        description: '',
        requirements: '',
      });

      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to publish job. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modals.postJob.title', 'Publish Vacancy in West Godavari')}
      subtitle={t('modals.postJob.subtitle', 'Connect directly with verified local talent and regional campus graduates')}
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '0.75rem 1rem', borderRadius: 8, color: '#FCA5A5', fontSize: '0.86rem' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
                {t('profile.jobTitleLabel', 'Job Title')} *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Junior React Developer"
                value={formData.title}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: 'rgba(11, 16, 32, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '0.65rem 0.85rem',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
                {t('profile.companyLabel', 'Company / Organization Name')} *
              </label>
              <input
                type="text"
                name="company"
                required
                placeholder="e.g. Godavari Aqua Tech Exports"
                value={formData.company}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: 'rgba(11, 16, 32, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '0.65rem 0.85rem',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
                {t('profile.locationLabel', 'West Godavari Location')} *
              </label>
              <select
                name="town"
                value={formData.town}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#111A2E',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '0.65rem 0.85rem',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="Bhimavaram">Bhimavaram</option>
                <option value="Eluru">Eluru</option>
                <option value="Tadepalligudem">Tadepalligudem</option>
                <option value="Tanuku">Tanuku</option>
                <option value="Palakollu">Palakollu</option>
                <option value="Narsapur">Narsapur</option>
                <option value="Jangareddygudem">Jangareddygudem</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
                Area / Landmark Details
              </label>
              <input
                type="text"
                name="locationDetail"
                placeholder="e.g. Industrial Area or PP Road"
                value={formData.locationDetail}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: 'rgba(11, 16, 32, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '0.65rem 0.85rem',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
                {t('profile.targetCategoryLabel', 'Career Sector')} *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#111A2E',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '0.65rem 0.85rem',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="it-software">IT & Software</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="retail-sales">Retail & Sales</option>
                <option value="office-admin">Office & Admin</option>
                <option value="hospitality">Hospitality</option>
                <option value="skilled-technical">Skilled & Technical</option>
                <option value="fresher-opportunities">Fresher Special</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
                {t('profile.employmentTypeLabel', 'Employment Type')}
              </label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#111A2E',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '0.65rem 0.85rem',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
                {t('profile.workModeLabel', 'Work Mode')}
              </label>
              <select
                name="workMode"
                value={formData.workMode}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#111A2E',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '0.65rem 0.85rem',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
                {t('profile.expectedSalaryLabel', 'Salary / Compensation')}
              </label>
              <input
                type="text"
                name="salary"
                placeholder="e.g. ₹3.5 - ₹5.0 LPA or ₹25,000 / mo"
                value={formData.salary}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: 'rgba(11, 16, 32, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '0.65rem 0.85rem',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
                {t('jobs.experienceLevel', 'Experience Required')}
              </label>
              <input
                type="text"
                name="experience"
                placeholder="e.g. Fresher or 1 - 3 Years"
                value={formData.experience}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: 'rgba(11, 16, 32, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '0.65rem 0.85rem',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#E2E8F0' }}>
            <input
              type="checkbox"
              name="isFresher"
              checked={formData.isFresher}
              onChange={handleChange}
            />
            <span>{t('jobs.fresherFriendly', 'Fresher Friendly')} (0-1 {t('jobseeker.workExperience', 'years experience')})</span>
          </label>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
              {t('jobs.responsibilities', 'Job Description & Responsibilities')} *
            </label>
            <textarea
              name="description"
              rows={3}
              required
              placeholder="Describe the day-to-day duties, team context, and key objectives..."
              value={formData.description}
              onChange={handleChange}
              style={{
                width: '100%',
                background: 'rgba(11, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                padding: '0.65rem 0.85rem',
                color: '#F8FAFC',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'block', marginBottom: '0.25rem' }}>
              {t('jobs.requirements', 'Candidate Qualifications & Key Skills')} ({t('common.optional', 'Optional')})
            </label>
            <textarea
              name="requirements"
              rows={2}
              placeholder="B.Tech or Degree in related field&#10;Good communication in Telugu and English"
              value={formData.requirements}
              onChange={handleChange}
              style={{
                width: '100%',
                background: 'rgba(11, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                padding: '0.65rem 0.85rem',
                color: '#F8FAFC',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '0.5rem',
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              border: 'none',
              borderRadius: 8,
              padding: '0.8rem',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? t('common.loading', 'Publishing Opening...') : `${t('recruiter.postNewJob', 'Publish Job Opening')} →`}
          </button>
        </form>
      </div>
    </Modal>
  );
}
