import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/common/LanguageSelector';
import { userService } from '../services/api';
import { calculateProfileCompleteness } from '../utils/completeness';
import Toast from '../components/common/Toast';
import styles from './JobSeekerProfilePage.module.css';

const WEST_GODAVARI_TOWNS = [
  'Bhimavaram',
  'Eluru',
  'Tadepalligudem',
  'Tanuku',
  'Palakollu',
  'Narsapur',
  'Jangareddygudem',
];

const JOB_CATEGORIES = [
  { id: 'it-software', label: 'IT & Software' },
  { id: 'education', label: 'Education' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'retail-sales', label: 'Retail & Sales' },
  { id: 'office-admin', label: 'Office & Admin' },
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'skilled-technical', label: 'Skilled & Technical' },
  { id: 'fresher-opportunities', label: 'Fresher Opportunities' },
];

export default function JobSeekerProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Master profile state
  const [formData, setFormData] = useState({
    name: user?.name || 'Local Job Seeker',
    headline: user?.jobseekerProfile?.headline || '',
    summary: user?.jobseekerProfile?.summary || '',
    location: user?.jobseekerProfile?.location || 'Bhimavaram',
    phone: user?.jobseekerProfile?.phone || '',
    isFresher: user?.jobseekerProfile?.isFresher !== false,
    portfolioLinks: {
      portfolio: user?.jobseekerProfile?.portfolioLinks?.portfolio || '',
      github: user?.jobseekerProfile?.portfolioLinks?.github || '',
      linkedin: user?.jobseekerProfile?.portfolioLinks?.linkedin || '',
    },
    skills: user?.jobseekerProfile?.skills || ['React.js', 'JavaScript', 'HTML/CSS'],
    softSkills: user?.jobseekerProfile?.softSkills || ['Communication', 'Teamwork'],
    education: user?.jobseekerProfile?.education || [
      {
        institution: 'SRKR Engineering College, Bhimavaram',
        degree: 'B.Tech in Computer Science',
        fieldOfStudy: 'Computer Science',
        graduationYear: '2026',
        grade: '8.4 CGPA',
      },
    ],
    workExperience: user?.jobseekerProfile?.workExperience || [],
    projects: user?.jobseekerProfile?.projects || [
      {
        title: 'West Godavari Hyperlocal Job Portal',
        description: 'Full-stack platform connecting local employers with regional talent.',
        technologies: ['React', 'Node.js', 'Express', 'MongoDB'],
        link: 'https://github.com/LocalHire/localhire-portal',
      },
    ],
    certifications: user?.jobseekerProfile?.certifications || [],
    jobPreferences: {
      preferredLocations: user?.jobseekerProfile?.jobPreferences?.preferredLocations || ['Bhimavaram', 'Eluru'],
      categories: user?.jobseekerProfile?.jobPreferences?.categories || ['it-software'],
      employmentTypes: user?.jobseekerProfile?.jobPreferences?.employmentTypes || ['Full-time'],
      workModes: user?.jobseekerProfile?.jobPreferences?.workModes || ['On-site', 'Hybrid'],
      experienceLevel: user?.jobseekerProfile?.jobPreferences?.experienceLevel || 'Fresher / Entry-Level',
      expectedSalary: user?.jobseekerProfile?.jobPreferences?.expectedSalary || '₹3.5 - ₹5.0 LPA',
    },
    privacySettings: {
      visibleToRecruiters: user?.jobseekerProfile?.privacySettings?.visibleToRecruiters !== false,
      allowContact: user?.jobseekerProfile?.privacySettings?.allowContact !== false,
    },
  });

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [dbNotice, setDbNotice] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Inline sub-form states
  const [newSkill, setNewSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');

  const [showEduForm, setShowEduForm] = useState(false);
  const [eduDraft, setEduDraft] = useState({ institution: '', degree: '', fieldOfStudy: '', graduationYear: '', grade: '' });

  const [showExpForm, setShowExpForm] = useState(false);
  const [expDraft, setExpDraft] = useState({ title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });

  const [showProjForm, setShowProjForm] = useState(false);
  const [projDraft, setProjDraft] = useState({ title: '', description: '', technologies: '', link: '' });

  const [showCertForm, setShowCertForm] = useState(false);
  const [certDraft, setCertDraft] = useState({ name: '', issuingOrganization: '', issueDate: '', credentialUrl: '' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Compute profile completeness score dynamically
  const completeness = useMemo(() => {
    return calculateProfileCompleteness(formData);
  }, [formData]);

  // Handle generic field change
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  // Handle portfolio links
  const handleLinkChange = (key, val) => {
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: {
        ...prev.portfolioLinks,
        [key]: val,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Skill tags handlers
  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (formData.skills.includes(trimmed)) {
      showToast('Skill already added to list.', 'warning');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));
    setNewSkill('');
    setHasUnsavedChanges(true);
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddSoftSkill = (e) => {
    e.preventDefault();
    const trimmed = newSoftSkill.trim();
    if (!trimmed) return;
    if (formData.softSkills.includes(trimmed)) {
      showToast('Soft skill already added.', 'warning');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      softSkills: [...prev.softSkills, trimmed],
    }));
    setNewSoftSkill('');
    setHasUnsavedChanges(true);
  };

  const handleRemoveSoftSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      softSkills: prev.softSkills.filter((s) => s !== skillToRemove),
    }));
    setHasUnsavedChanges(true);
  };

  // Education handlers
  const handleSaveEducation = (e) => {
    e.preventDefault();
    if (!eduDraft.institution.trim() || !eduDraft.degree.trim()) {
      showToast('Institution and degree are required.', 'error');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { ...eduDraft }],
    }));
    setEduDraft({ institution: '', degree: '', fieldOfStudy: '', graduationYear: '', grade: '' });
    setShowEduForm(false);
    setHasUnsavedChanges(true);
  };

  const handleDeleteEducation = (idx) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
    setHasUnsavedChanges(true);
  };

  // Work experience handlers
  const handleSaveExperience = (e) => {
    e.preventDefault();
    if (!expDraft.title.trim() || !expDraft.company.trim()) {
      showToast('Job title and company name are required.', 'error');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      workExperience: [...prev.workExperience, { ...expDraft }],
    }));
    setExpDraft({ title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    setShowExpForm(false);
    setHasUnsavedChanges(true);
  };

  const handleDeleteExperience = (idx) => {
    setFormData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== idx),
    }));
    setHasUnsavedChanges(true);
  };

  // Projects handlers
  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!projDraft.title.trim()) {
      showToast('Project title is required.', 'error');
      return;
    }
    const techArray = typeof projDraft.technologies === 'string'
      ? projDraft.technologies.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    setFormData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          title: projDraft.title.trim(),
          description: projDraft.description.trim(),
          technologies: techArray,
          link: projDraft.link.trim(),
        },
      ],
    }));
    setProjDraft({ title: '', description: '', technologies: '', link: '' });
    setShowProjForm(false);
    setHasUnsavedChanges(true);
  };

  const handleDeleteProject = (idx) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
    setHasUnsavedChanges(true);
  };

  // Certifications handlers
  const handleSaveCert = (e) => {
    e.preventDefault();
    if (!certDraft.name.trim()) {
      showToast('Certification name is required.', 'error');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { ...certDraft }],
    }));
    setCertDraft({ name: '', issuingOrganization: '', issueDate: '', credentialUrl: '' });
    setShowCertForm(false);
    setHasUnsavedChanges(true);
  };

  const handleDeleteCert = (idx) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx),
    }));
    setHasUnsavedChanges(true);
  };

  // Submit profile to backend
  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    setDbNotice('');

    try {
      const payload = {
        name: formData.name.trim(),
        jobseekerProfile: {
          headline: formData.headline.trim(),
          summary: formData.summary.trim(),
          location: formData.location.trim(),
          phone: formData.phone.trim(),
          isFresher: formData.isFresher,
          portfolioLinks: formData.portfolioLinks,
          skills: formData.skills,
          softSkills: formData.softSkills,
          education: formData.education,
          workExperience: formData.workExperience,
          projects: formData.projects,
          certifications: formData.certifications,
          jobPreferences: formData.jobPreferences,
          privacySettings: formData.privacySettings,
        },
      };

      const res = await userService.updateProfile(payload);
      showToast(`✓ ${t('profile.savedSuccess', 'Profile saved successfully!')}`, 'success');
      setHasUnsavedChanges(false);
    } catch (err) {
      if (err.status === 503) {
        setDbNotice(err.message);
        showToast('⚠️ MongoDB Atlas required for persistent save.', 'info');
      } else {
        showToast(err.message || 'Failed to save profile. Please check validation rules.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreferenceToggle = (group, item) => {
    setFormData((prev) => {
      const currentList = prev.jobPreferences[group] || [];
      const updatedList = currentList.includes(item)
        ? currentList.filter((x) => x !== item)
        : [...currentList, item];

      return {
        ...prev,
        jobPreferences: {
          ...prev.jobPreferences,
          [group]: updatedList,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  return (
    <div className={styles.profileWrapper}>
      {/* Top Banner */}
      <div className={styles.topBanner}>
        <div className={styles.headerInfo}>
          <div className={styles.avatar}>
            {formData.name ? formData.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className={styles.titleDetails}>
            <h1>{formData.name}</h1>
            <span className={styles.userEmail}>{user?.email || 'seeker@localhire.dev'}</span>
            <div className={styles.badgeRow}>
              <span className={styles.roleBadge}>🎓 {t('jobseeker.welcome', 'Verified Job Seeker')}</span>
              {formData.isFresher && (
                <span className={styles.fresherBadge}>🌱 {t('freshers.badge', 'Fresher / Campus Graduate')}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.bannerActions} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <LanguageSelector />
          <Link to="/student/dashboard" className={styles.backBtn}>
            ← {t('common.back', 'Back to Dashboard')}
          </Link>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSaveProfile}
            disabled={isSubmitting}
          >
            <span>💾</span> {isSubmitting ? t('profile.savingBtn', 'Saving Profile...') : t('profile.saveBtn', 'Save Profile Changes')}
          </button>
        </div>
      </div>

      {/* Database Availability Notice */}
      {dbNotice && (
        <div className={styles.dbNoticeAlert}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <strong>MongoDB Atlas Required:</strong> {dbNotice}
          </div>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className={styles.unsavedNotice}>
          <span>● {t('profile.unsavedWarning', 'You have unsaved changes in your profile.')}</span>
          <button
            type="button"
            onClick={handleSaveProfile}
            style={{ background: '#7C3AED', color: '#FFFFFF', border: 'none', padding: '0.25rem 0.65rem', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            {t('common.save', 'Save Now')}
          </button>
        </div>
      )}

      {/* Profile Completeness Score Card */}
      <div className={styles.completenessCard}>
        <div className={styles.completenessHeader}>
          <div className={styles.meterTitle}>
            <span>📊</span> {t('profile.completeness', 'Profile Strength & Completeness')}
          </div>
          <div className={styles.meterPercentage}>{completeness.score}% Complete</div>
        </div>

        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${completeness.score}%` }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.84rem', color: completeness.score >= 80 ? '#34D399' : '#FCD34D' }}>
            {completeness.score === 100
              ? '🌟 Excellent! Your profile is 100% complete and fully optimized for West Godavari recruiters.'
              : `${completeness.incompleteSuggestions.length} recommendation(s) remaining to reach full completeness.`}
          </span>
          <button
            type="button"
            className={styles.checklistToggle}
            onClick={() => setShowChecklist(!showChecklist)}
          >
            {showChecklist ? 'Hide Breakdown ▲' : 'View Section Breakdown ▼'}
          </button>
        </div>

        {showChecklist && (
          <div className={styles.checklistDrawer}>
            {Object.keys(completeness.sections).map((key) => {
              const sec = completeness.sections[key];
              return (
                <div key={key} className={styles.checklistItem}>
                  <span className={`${styles.checkStatusIcon} ${sec.completed ? styles.checkComplete : styles.checkIncomplete}`}>
                    {sec.completed ? '✓' : '○'}
                  </span>
                  <div>
                    <strong>{sec.label}</strong> ({sec.weight}% weight)
                    {!sec.completed && (
                      <div style={{ color: '#94A3B8', fontSize: '0.78rem' }}>Tip: {sec.suggestion}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.disclaimerText}>
          ℹ️ {completeness.disclaimer}
        </div>
      </div>

      {/* Profile Sections Container */}
      <div className={styles.sectionsContainer}>
        {/* 1. Personal Information */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span>👤</span> {t('profile.personalInfoTitle', 'Personal Information')}
            </h3>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.fullNameLabel', 'Full Name')} *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g. Satyanarayana Varma"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.headlineLabel', 'Professional Headline')} *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.headline}
                onChange={(e) => handleFieldChange('headline', e.target.value)}
                placeholder={t('profile.headlinePlaceholder', 'e.g. Full-Stack Developer | React & Node.js')}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.locationLabel', 'West Godavari Location')} *</label>
              <select
                className={styles.select}
                value={formData.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
              >
                {WEST_GODAVARI_TOWNS.map((town) => (
                  <option key={town} value={town}>
                    {town}, West Godavari
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.phoneLabel', 'Contact Phone Number')}</label>
              <input
                type="tel"
                className={styles.input}
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>{t('profile.summaryLabel', 'Professional Summary / Bio')}</label>
              <textarea
                className={styles.textarea}
                value={formData.summary}
                onChange={(e) => handleFieldChange('summary', e.target.value)}
                placeholder={t('profile.summaryPlaceholder', 'Briefly describe your background, career objectives, and strongest skills...')}
              />
            </div>

            {/* Portfolio Links */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.portfolioUrl', 'Portfolio Website')}</label>
              <input
                type="url"
                className={styles.input}
                value={formData.portfolioLinks.portfolio}
                onChange={(e) => handleLinkChange('portfolio', e.target.value)}
                placeholder="https://yourname.dev"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.githubUrl', 'GitHub Profile')}</label>
              <input
                type="url"
                className={styles.input}
                value={formData.portfolioLinks.github}
                onChange={(e) => handleLinkChange('github', e.target.value)}
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>{t('profile.linkedinUrl', 'LinkedIn Profile')}</label>
              <input
                type="url"
                className={styles.input}
                value={formData.portfolioLinks.linkedin}
                onChange={(e) => handleLinkChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
          </div>
        </section>

        {/* 2. Skills & Competencies */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span>⚡</span> {t('profile.skillsSectionTitle', 'Skills & Competencies')}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className={styles.label}>{t('jobseeker.skills', 'Technical Skills')}</label>
              <div className={styles.tagsWrapper}>
                {formData.skills.map((skill) => (
                  <span key={skill} className={styles.tagPill}>
                    {skill}
                    <button
                      type="button"
                      className={styles.tagRemoveBtn}
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <form onSubmit={handleAddSkill} style={{ display: 'inline-flex' }}>
                  <input
                    type="text"
                    className={styles.tagInput}
                    placeholder={t('profile.addSkillPlaceholder', '+ Type skill & press Enter...')}
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                  />
                </form>
              </div>
            </div>

            <div>
              <label className={styles.label}>{t('profile.softSkillsTitle', 'Soft & Interpersonal Skills')}</label>
              <div className={styles.tagsWrapper}>
                {formData.softSkills.map((skill) => (
                  <span key={skill} className={styles.tagPill} style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#A7F3D0' }}>
                    {skill}
                    <button
                      type="button"
                      className={styles.tagRemoveBtn}
                      onClick={() => handleRemoveSoftSkill(skill)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <form onSubmit={handleAddSoftSkill} style={{ display: 'inline-flex' }}>
                  <input
                    type="text"
                    className={styles.tagInput}
                    placeholder={t('profile.addSoftSkillPlaceholder', '+ Type soft skill & press Enter...')}
                    value={newSoftSkill}
                    onChange={(e) => setNewSoftSkill(e.target.value)}
                  />
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Educational Qualifications */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span>🎓</span> {t('profile.educationTitle', 'Educational Qualifications')} ({formData.education.length})
            </h3>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setShowEduForm(!showEduForm)}
            >
              {showEduForm ? t('common.cancel', 'Cancel') : t('profile.addEduBtn', '+ Add Qualification')}
            </button>
          </div>

          <div className={styles.cardsList}>
            {formData.education.map((edu, idx) => (
              <div key={idx} className={styles.itemCard}>
                <div className={styles.itemCardInfo}>
                  <h4>{edu.degree}</h4>
                  <div className={styles.itemSubtitle}>🏛️ {edu.institution}</div>
                  <div className={styles.itemMeta}>
                    <span>Field: {edu.fieldOfStudy || 'General'}</span>
                    {edu.graduationYear && <span> • Class of {edu.graduationYear}</span>}
                    {edu.grade && <span> • Grade: {edu.grade}</span>}
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteEducation(idx)}
                  >
                    {t('common.delete', 'Remove')} ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showEduForm && (
            <form onSubmit={handleSaveEducation} className={styles.inlineForm}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('profile.institutionLabel', 'Institution / College')} *</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    placeholder={t('profile.institutionPlaceholder', 'e.g. SRKR Engineering College')}
                    value={eduDraft.institution}
                    onChange={(e) => setEduDraft({ ...eduDraft, institution: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('profile.degreeLabel', 'Degree / Certificate')} *</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    placeholder={t('profile.degreePlaceholder', 'e.g. B.Tech or B.Sc')}
                    value={eduDraft.degree}
                    onChange={(e) => setEduDraft({ ...eduDraft, degree: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('profile.fieldLabel', 'Field of Study')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Computer Science"
                    value={eduDraft.fieldOfStudy}
                    onChange={(e) => setEduDraft({ ...eduDraft, fieldOfStudy: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('profile.gradYearLabel', 'Graduation Year')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. 2026"
                    value={eduDraft.graduationYear}
                    onChange={(e) => setEduDraft({ ...eduDraft, graduationYear: e.target.value })}
                  />
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>{t('profile.gradeLabel', 'Grade / CGPA')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. 8.5 CGPA or 82%"
                    value={eduDraft.grade}
                    onChange={(e) => setEduDraft({ ...eduDraft, grade: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.inlineFormActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowEduForm(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  {t('common.save', 'Save Qualification')}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 4. Work Experience & Fresher Support */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span>💼</span> {t('profile.experienceTitle', 'Work Experience & Career Status')}
            </h3>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setShowExpForm(!showExpForm)}
            >
              {showExpForm ? t('common.cancel', 'Cancel') : t('profile.addExpBtn', '+ Add Experience')}
            </button>
          </div>

          {/* Fresher Status Toggle */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isFresher}
                onChange={(e) => handleFieldChange('isFresher', e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#10B981' }}
              />
              <span style={{ fontWeight: 700, color: '#34D399', fontSize: '0.92rem' }}>
                🌱 {t('profile.fresherToggleDesc', 'I am a Fresher / Entry-Level Candidate (Zero corporate experience required)')}
              </span>
            </label>
            <p style={{ margin: '0.4rem 0 0 1.8rem', color: '#94A3B8', fontSize: '0.82rem', lineHeight: 1.45 }}>
              {t('jobseeker.fresherNotice', 'Freshers are fully supported on LocalHire. Work experience is optional.')}
            </p>
          </div>

          <div className={styles.cardsList}>
            {formData.workExperience.length > 0 ? (
              formData.workExperience.map((exp, idx) => (
                <div key={idx} className={styles.itemCard}>
                  <div className={styles.itemCardInfo}>
                    <h4>{exp.title}</h4>
                    <div className={styles.itemSubtitle}>🏢 {exp.company} {exp.location && `• 📍 ${exp.location}`}</div>
                    <div className={styles.itemMeta}>
                      <span>{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'N/A'}</span>
                    </div>
                    {exp.description && <p className={styles.itemDesc}>{exp.description}</p>}
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteExperience(idx)}
                    >
                      {t('common.delete', 'Remove')} ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8', fontSize: '0.88rem' }}>
                {formData.isFresher
                  ? 'No prior experience required for freshers. You can optionally add internships.'
                  : 'No corporate experience added yet. Click "+ Add Experience" to record employment history.'}
              </div>
            )}
          </div>

          {showExpForm && (
            <form onSubmit={handleSaveExperience} className={styles.inlineForm}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('profile.jobTitleLabel', 'Job Title / Role')} *</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    placeholder="e.g. Junior Web Developer"
                    value={expDraft.title}
                    onChange={(e) => setExpDraft({ ...expDraft, title: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('profile.companyLabel', 'Company / Employer')} *</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    placeholder="e.g. Godavari Digital Solutions"
                    value={expDraft.company}
                    onChange={(e) => setExpDraft({ ...expDraft, company: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('profile.locationLabel', 'Location')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Bhimavaram, AP"
                    value={expDraft.location}
                    onChange={(e) => setExpDraft({ ...expDraft, location: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('profile.startDateLabel', 'Dates (Start – End)')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Jun 2024 – Present"
                    value={expDraft.startDate}
                    onChange={(e) => setExpDraft({ ...expDraft, startDate: e.target.value })}
                  />
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>{t('profile.expDescLabel', 'Role Description & Key Accomplishments')}</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Summary of responsibilities and technologies used..."
                    value={expDraft.description}
                    onChange={(e) => setExpDraft({ ...expDraft, description: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.inlineFormActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowExpForm(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  {t('common.save', 'Save Experience')}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 5. Projects & Portfolios */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span>💻</span> {t('profile.projectsTitle', 'Projects & Portfolio Showcase')} ({formData.projects.length})
            </h3>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setShowProjForm(!showProjForm)}
            >
              {showProjForm ? t('common.cancel', 'Cancel') : t('profile.addProjBtn', '+ Add Project')}
            </button>
          </div>

          <div className={styles.cardsList}>
            {formData.projects.map((proj, idx) => (
              <div key={idx} className={styles.itemCard}>
                <div className={styles.itemCardInfo}>
                  <h4>{proj.title}</h4>
                  <p className={styles.itemDesc}>{proj.description}</p>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.4rem 0' }}>
                      {proj.technologies.map((t, ti) => (
                        <span key={ti} style={{ fontSize: '0.72rem', background: 'rgba(124, 58, 237, 0.2)', color: '#DDD6FE', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: '#A78BFA', textDecoration: 'none' }}
                    >
                      🔗 {t('common.view', 'View Project Repository / Demo')} →
                    </a>
                  )}
                </div>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteProject(idx)}
                  >
                    {t('common.delete', 'Remove')} ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showProjForm && (
            <form onSubmit={handleSaveProject} className={styles.inlineForm}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('profile.projTitleLabel', 'Project Title')} *</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    placeholder="e.g. Aquaculture Farm IoT Monitor"
                    value={projDraft.title}
                    onChange={(e) => setProjDraft({ ...projDraft, title: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('profile.projTechLabel', 'Technologies Used (comma separated)')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. React, Node.js, ESP32"
                    value={projDraft.technologies}
                    onChange={(e) => setProjDraft({ ...projDraft, technologies: e.target.value })}
                  />
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>{t('profile.projLinkLabel', 'Project Link / GitHub URL')}</label>
                  <input
                    type="url"
                    className={styles.input}
                    placeholder="https://github.com/..."
                    value={projDraft.link}
                    onChange={(e) => setProjDraft({ ...projDraft, link: e.target.value })}
                  />
                </div>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>{t('profile.projDescLabel', 'Description')}</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Explain what the project does, key challenges solved, and your role..."
                    value={projDraft.description}
                    onChange={(e) => setProjDraft({ ...projDraft, description: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.inlineFormActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowProjForm(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  {t('common.save', 'Save Project')}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 6. Certifications */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span>📜</span> {t('jobseeker.certifications', 'Certifications & Credentials')} ({formData.certifications.length})
            </h3>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setShowCertForm(!showCertForm)}
            >
              {showCertForm ? t('common.cancel', 'Cancel') : '+ Add Certification'}
            </button>
          </div>

          <div className={styles.cardsList}>
            {formData.certifications.map((cert, idx) => (
              <div key={idx} className={styles.itemCard}>
                <div className={styles.itemCardInfo}>
                  <h4>{cert.name}</h4>
                  <div className={styles.itemSubtitle}>🏅 {cert.issuingOrganization}</div>
                  {cert.issueDate && <div className={styles.itemMeta}>Issued: {cert.issueDate}</div>}
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: '#A78BFA', textDecoration: 'none' }}
                    >
                      🔗 Verify Credential →
                    </a>
                  )}
                </div>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteCert(idx)}
                  >
                    {t('common.delete', 'Remove')} ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showCertForm && (
            <form onSubmit={handleSaveCert} className={styles.inlineForm}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Certification Name *</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    placeholder="e.g. AWS Certified Cloud Practitioner"
                    value={certDraft.name}
                    onChange={(e) => setCertDraft({ ...certDraft, name: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Issuing Organization</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Amazon Web Services"
                    value={certDraft.issuingOrganization}
                    onChange={(e) => setCertDraft({ ...certDraft, issuingOrganization: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Issue Date</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Aug 2025"
                    value={certDraft.issueDate}
                    onChange={(e) => setCertDraft({ ...certDraft, issueDate: e.target.value })}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Credential URL</label>
                  <input
                    type="url"
                    className={styles.input}
                    placeholder="https://..."
                    value={certDraft.credentialUrl}
                    onChange={(e) => setCertDraft({ ...certDraft, credentialUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.inlineFormActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowCertForm(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  {t('common.save', 'Save Certification')}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 7. Job & Career Preferences */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span>🎯</span> {t('profile.preferencesTitle', 'Career & Location Preferences')}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className={styles.label}>{t('profile.preferredTownsLabel', 'Preferred West Godavari Mandals / Towns')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {WEST_GODAVARI_TOWNS.map((town) => {
                  const isSelected = formData.jobPreferences.preferredLocations.includes(town);
                  return (
                    <button
                      key={town}
                      type="button"
                      onClick={() => handlePreferenceToggle('preferredLocations', town)}
                      style={{
                        background: isSelected ? '#E9F9F8' : '#FFFFFF',
                        border: isSelected ? '1px solid #0F9D96' : '1px solid #E1EDF3',
                        color: isSelected ? '#0F766E' : '#526B85',
                        padding: '0.4rem 0.85rem',
                        borderRadius: 999,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isSelected ? '✓ ' : ''}{town}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={styles.label}>{t('profile.targetCategoryLabel', 'Target Career Sectors')}</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                {JOB_CATEGORIES.map((cat) => {
                  const isSelected = formData.jobPreferences.categories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handlePreferenceToggle('categories', cat.id)}
                      style={{
                        background: isSelected ? '#F3EFFF' : '#FFFFFF',
                        border: isSelected ? '1px solid #8B5CF6' : '1px solid #E1EDF3',
                        color: isSelected ? '#6D28D9' : '#526B85',
                        padding: '0.4rem 0.85rem',
                        borderRadius: 999,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isSelected ? '✓ ' : ''}{cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{t('jobs.experienceLevel', 'Experience Level')}</label>
                <select
                  className={styles.select}
                  value={formData.jobPreferences.experienceLevel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      jobPreferences: { ...prev.jobPreferences, experienceLevel: e.target.value },
                    }))
                  }
                >
                  <option value="Fresher / Entry-Level">Fresher / Entry-Level (0 - 1 Year)</option>
                  <option value="1 - 3 Years">Junior (1 - 3 Years)</option>
                  <option value="3 - 5 Years">Mid-Level (3 - 5 Years)</option>
                  <option value="5+ Years">Senior / Specialist (5+ Years)</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>{t('profile.expectedSalaryLabel', 'Expected Compensation')}</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. ₹3.5 - ₹5.0 LPA or ₹25,000 / mo"
                  value={formData.jobPreferences.expectedSalary}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      jobPreferences: { ...prev.jobPreferences, expectedSalary: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* 8. Candidate Privacy Controls */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span>🔒</span> {t('profile.privacyTitle', 'Privacy & Recruiter Discovery Controls')}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className={styles.toggleRow}>
              <div>
                <span className={styles.toggleLabel}>{t('profile.visibleRecruitersLabel', 'Profile Visible to Verified Employers')}</span>
                <span className={styles.toggleDesc}>
                  Allow verified regional recruiters in West Godavari to discover your qualifications and invite you to interviews.
                </span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={formData.privacySettings.visibleToRecruiters}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      privacySettings: { ...prev.privacySettings, visibleToRecruiters: e.target.checked },
                    }))
                  }
                />
                <span className={styles.slider} />
              </label>
            </div>

            <div className={styles.toggleRow}>
              <div>
                <span className={styles.toggleLabel}>{t('profile.allowContactLabel', 'Direct Communication Permissions')}</span>
                <span className={styles.toggleDesc}>
                  Permit registered employers to send you application inquiries via email and telephone.
                </span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={formData.privacySettings.allowContact}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      privacySettings: { ...prev.privacySettings, allowContact: e.target.checked },
                    }))
                  }
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Save Actions Bar */}
      <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
        <Link to="/student/dashboard" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
          {t('common.cancel', 'Discard / Cancel')}
        </Link>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSaveProfile}
          disabled={isSubmitting}
        >
          <span>💾</span> {isSubmitting ? t('profile.savingBtn', 'Saving Profile...') : t('profile.saveBtn', 'Save Profile Changes')}
        </button>
      </div>

      {/* Toast Notification */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'info' })}
        />
      )}
    </div>
  );
}
