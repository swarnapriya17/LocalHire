import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { jobService, applicationService, recruiterService } from '../services/api';
import PostJobInfoModal from '../components/home/PostJobInfoModal';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import LanguageSelector from '../components/common/LanguageSelector';
import NotificationBell from '../components/common/NotificationBell';
import styles from './Dashboard.module.css';

const APPLICATION_STATUS_OPTIONS = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Rejected',
  'Hired',
];

const JOB_CATEGORIES = [
  { id: 'it-software', name: 'IT & Software Development' },
  { id: 'education', name: 'Teaching & Education' },
  { id: 'healthcare', name: 'Healthcare & Nursing' },
  { id: 'retail-sales', name: 'Retail, Sales & Marketing' },
  { id: 'office-admin', name: 'Office Admin & Accounts' },
  { id: 'hospitality', name: 'Hospitality & Tourism' },
  { id: 'skilled-technical', name: 'Skilled Trades & Technical' },
  { id: 'fresher-opportunities', name: 'Fresher & Entry-Level' },
];

const WEST_GODAVARI_TOWNS = [
  'Bhimavaram',
  'Eluru',
  'Tadepalligudem',
  'Tanuku',
  'Palakollu',
  'Narsapur',
  'Jangareddygudem',
];

export default function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'jobs' | 'pipeline' | 'interviews' | 'company'

  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Job management state
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobFilter, setJobFilter] = useState('all');

  // Overview & Analytics state
  const [summaryData, setSummaryData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isDbUnavailable, setIsDbUnavailable] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Applicant pipeline state
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobApplications, setJobApplications] = useState([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // Scheduled interviews state
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(false);

  // Status & Interview Modal state
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [newStatus, setNewStatus] = useState('Under Review');
  const [statusNotes, setStatusNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Company Profile Form state
  const [companyForm, setCompanyForm] = useState({
    name: user?.name || '',
    companyName: user?.recruiterProfile?.companyName || '',
    companyDescription: user?.recruiterProfile?.companyDescription || '',
    companyWebsite: user?.recruiterProfile?.companyWebsite || '',
    phone: user?.recruiterProfile?.phone || '',
    contactEmail: user?.recruiterProfile?.contactEmail || user?.email || '',
    location: user?.recruiterProfile?.location || 'West Godavari',
    town: user?.recruiterProfile?.town || 'Bhimavaram',
    address: user?.recruiterProfile?.address || '',
    industry: user?.recruiterProfile?.industry || 'Information Technology',
    designation: user?.recruiterProfile?.designation || 'Hiring Manager',
    logoUrl: user?.recruiterProfile?.logoUrl || '',
  });
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [companySuccess, setCompanySuccess] = useState('');

  // 1. Fetch Recruiter Jobs
  const fetchRecruiterJobs = useCallback(async () => {
    try {
      setIsLoadingJobs(true);
      const res = await jobService.getMyJobs();
      if (res && Array.isArray(res.jobs)) {
        setRecruiterJobs(res.jobs);
      } else {
        const generalRes = await jobService.getJobs({ limit: 6 });
        if (generalRes && Array.isArray(generalRes.data)) {
          setRecruiterJobs(generalRes.data.slice(0, 3));
        }
      }
    } catch (err) {
      console.warn('Recruiter jobs fetch note:', err.message);
      try {
        const generalRes = await jobService.getJobs({ limit: 3 });
        if (generalRes && Array.isArray(generalRes.data)) {
          setRecruiterJobs(generalRes.data.slice(0, 3));
        }
      } catch (e) {
        setRecruiterJobs([]);
      }
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  // 2. Fetch Dashboard Summary & Analytics
  const fetchSummaryAndAnalytics = useCallback(async () => {
    try {
      setIsLoadingMetrics(true);
      const [sumRes, anaRes] = await Promise.allSettled([
        recruiterService.getSummary(),
        recruiterService.getAnalytics(),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummaryData(sumRes.value.data);
        setIsDbUnavailable(false);
      } else if (sumRes.reason?.statusCode === 503 || sumRes.reason?.message?.includes('MongoDB')) {
        setIsDbUnavailable(true);
      }

      if (anaRes.status === 'fulfilled' && anaRes.value?.data) {
        setAnalyticsData(anaRes.value.data);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  // 3. Fetch Company Profile
  const fetchCompanyProfile = useCallback(async () => {
    try {
      const res = await recruiterService.getProfile();
      if (res && res.data) {
        const d = res.data;
        const p = d.recruiterProfile || {};
        setCompanyForm({
          name: d.name || '',
          companyName: p.companyName || '',
          companyDescription: p.companyDescription || '',
          companyWebsite: p.companyWebsite || '',
          phone: p.phone || '',
          contactEmail: p.contactEmail || d.email || '',
          location: p.location || 'West Godavari',
          town: p.town || 'Bhimavaram',
          address: p.address || '',
          industry: p.industry || 'Information Technology',
          designation: p.designation || 'Hiring Manager',
          logoUrl: p.logoUrl || '',
        });
      }
    } catch {
      // Fallback: keep initial state from user context
    }
  }, [user]);

  // 4. Fetch Scheduled Interviews
  const fetchInterviews = useCallback(async () => {
    try {
      setIsLoadingInterviews(true);
      const res = await recruiterService.getInterviews();
      if (res && res.data && Array.isArray(res.data.interviews)) {
        setScheduledInterviews(res.data.interviews);
      } else {
        setScheduledInterviews([]);
      }
    } catch {
      setScheduledInterviews([]);
    } finally {
      setIsLoadingInterviews(false);
    }
  }, []);

  useEffect(() => {
    fetchRecruiterJobs();
    fetchSummaryAndAnalytics();
    fetchCompanyProfile();
    fetchInterviews();
  }, [fetchRecruiterJobs, fetchSummaryAndAnalytics, fetchCompanyProfile, fetchInterviews]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Job Actions
  const handleDeleteJob = async (jobId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete the job vacancy "${title}"?`)) {
      return;
    }
    try {
      await jobService.deleteJob(jobId);
      setToastType('info');
      setToastMessage(`Job opening "${title}" has been removed.`);
      if (selectedJob && (selectedJob.id === jobId || selectedJob._id === jobId)) {
        setSelectedJob(null);
        setJobApplications([]);
      }
      fetchRecruiterJobs();
      fetchSummaryAndAnalytics();
    } catch (err) {
      setToastType('error');
      setToastMessage(err.message || 'Could not remove job opening.');
    }
  };

  const handleToggleJobStatus = async (job) => {
    const jobId = job.id || job._id;
    const nextStatus = job.status === 'closed' ? 'published' : 'closed';
    try {
      await jobService.updateJob(jobId, { status: nextStatus });
      setToastType('success');
      setToastMessage(`Job vacancy status set to "${nextStatus}".`);
      fetchRecruiterJobs();
      fetchSummaryAndAnalytics();
    } catch (err) {
      setToastType('error');
      setToastMessage(err.message || 'Could not update status.');
    }
  };

  const handleEditJobSubmit = async (e) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      setIsSavingJob(true);
      const jobId = editingJob.id || editingJob._id;
      const res = await jobService.updateJob(jobId, {
        title: editingJob.title,
        company: editingJob.company,
        town: editingJob.town,
        category: editingJob.category,
        employmentType: editingJob.employmentType,
        workMode: editingJob.workMode,
        experience: editingJob.experience,
        salary: editingJob.salary,
        description: editingJob.description,
        status: editingJob.status,
      });

      if (res && res.success) {
        setToastType('success');
        setToastMessage(`✓ Job "${editingJob.title}" updated successfully.`);
        setEditingJob(null);
        fetchRecruiterJobs();
        fetchSummaryAndAnalytics();
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(err.message || 'Could not update vacancy.');
    } finally {
      setIsSavingJob(false);
    }
  };

  const handleJobCreated = (newJob) => {
    setToastType('success');
    setToastMessage(`✓ Vacancy "${newJob.title}" created successfully.`);
    fetchRecruiterJobs();
    fetchSummaryAndAnalytics();
  };

  // View Applicants per Job
  const handleViewApplicants = async (job) => {
    const jobId = job.id || job._id;
    if (selectedJob && (selectedJob.id === jobId || selectedJob._id === jobId) && activeTab === 'pipeline') {
      setSelectedJob(null);
      setJobApplications([]);
      return;
    }

    setSelectedJob(job);
    setActiveTab('pipeline');
    setIsLoadingApps(true);

    try {
      const res = await applicationService.getJobApplications(jobId);
      if (res && Array.isArray(res.applications)) {
        setJobApplications(res.applications);
      } else {
        setJobApplications([]);
      }
    } catch (err) {
      setJobApplications([]);
    } finally {
      setIsLoadingApps(false);
    }
  };

  // Status & Interview Modal Actions
  const handleOpenStatusModal = (app) => {
    setStatusModalApp(app);
    setNewStatus(app.status || 'Under Review');
    setStatusNotes(app.recruiterNotes || '');
    if (app.interviewDetails) {
      setInterviewDate(app.interviewDetails.interviewDate || '');
      setInterviewTime(app.interviewDetails.interviewTime || '');
      setMeetingLink(app.interviewDetails.meetingLink || '');
      setInterviewLocation(app.interviewDetails.location || '');
      setInterviewNotes(app.interviewDetails.notes || '');
    } else {
      setInterviewDate('');
      setInterviewTime('');
      setMeetingLink('');
      setInterviewLocation('');
      setInterviewNotes('');
    }
    setStatusError('');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!statusModalApp) return;

    if (newStatus === 'Interview Scheduled' && !interviewDate && !interviewTime) {
      setStatusError('Please specify at least an interview date or time.');
      return;
    }

    try {
      setIsSavingStatus(true);
      setStatusError('');

      const appId = statusModalApp.id || statusModalApp._id;
      const payload = {
        status: newStatus,
        notes: statusNotes.trim(),
        ...(newStatus === 'Interview Scheduled' && {
          interviewDetails: {
            interviewDate: interviewDate.trim(),
            interviewTime: interviewTime.trim(),
            meetingLink: meetingLink.trim(),
            location: interviewLocation.trim(),
            notes: interviewNotes.trim(),
          },
        }),
      };

      const res = await applicationService.updateApplicationStatus(appId, payload);
      if (res && res.success) {
        setToastType('success');
        setToastMessage(`✓ Application status updated to "${newStatus}".`);

        // Refresh applications and interview lists
        setJobApplications((prev) =>
          prev.map((a) =>
            (a.id === appId || a._id === appId)
              ? {
                  ...a,
                  status: newStatus,
                  recruiterNotes: statusNotes.trim(),
                  interviewDetails: payload.interviewDetails || a.interviewDetails,
                }
              : a
          )
        );

        setStatusModalApp(null);
        fetchSummaryAndAnalytics();
        fetchInterviews();
      }
    } catch (err) {
      const msg = err.message || 'Could not update application status.';
      setStatusError(msg);
      setToastType('error');
      setToastMessage(msg);
    } finally {
      setIsSavingStatus(false);
    }
  };

  // Company Profile Update Action
  const handleCompanyProfileSubmit = async (e) => {
    e.preventDefault();
    setCompanyError('');
    setCompanySuccess('');

    if (companyForm.companyName.trim().length < 2) {
      setCompanyError('Company name must be at least 2 characters long.');
      return;
    }

    try {
      setIsSavingCompany(true);
      const res = await recruiterService.updateProfile({
        name: companyForm.name.trim(),
        recruiterProfile: {
          companyName: companyForm.companyName.trim(),
          companyDescription: companyForm.companyDescription.trim(),
          companyWebsite: companyForm.companyWebsite.trim(),
          phone: companyForm.phone.trim(),
          contactEmail: companyForm.contactEmail.trim(),
          location: companyForm.location.trim(),
          town: companyForm.town.trim(),
          address: companyForm.address.trim(),
          industry: companyForm.industry.trim(),
          designation: companyForm.designation.trim(),
          logoUrl: companyForm.logoUrl.trim(),
        },
      });

      if (res && res.success) {
        setCompanySuccess('✓ Company profile updated successfully.');
        setToastType('success');
        setToastMessage('✓ Company profile updated successfully.');
        fetchCompanyProfile();
        fetchSummaryAndAnalytics();
      }
    } catch (err) {
      const msg = err.message || 'Could not save company profile.';
      setCompanyError(msg);
      setToastType('error');
      setToastMessage(msg);
    } finally {
      setIsSavingCompany(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Applied':
        return { background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#60A5FA' };
      case 'Under Review':
        return { background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#FBBF24' };
      case 'Shortlisted':
        return { background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', color: '#22D3EE' };
      case 'Interview Scheduled':
        return { background: 'rgba(139, 92, 246, 0.22)', border: '1px solid rgba(167, 139, 250, 0.5)', color: '#C4B5FD', boxShadow: '0 0 10px rgba(124, 58, 237, 0.25)' };
      case 'Hired':
        return { background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34D399' };
      case 'Rejected':
        return { background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171' };
      default:
        return { background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#E2E8F0' };
    }
  };

  const filteredJobs = recruiterJobs.filter((j) => {
    if (jobFilter === 'all') return true;
    return j.status === jobFilter;
  });

  const isEmployerVerified = Boolean(summaryData?.isVerified || user?.isVerified);

  return (
    <div className={styles.dashboardWrapper}>
      {/* Top Banner */}
      <div className={styles.topBanner}>
        <div className={styles.userInfo}>
          <div className={styles.avatar} style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' }}>
            🏢
          </div>
          <div className={styles.userDetails}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 className={styles.userName}>
                {companyForm.companyName || user?.name || 'Recruiter Portal'}
              </h1>
              {isEmployerVerified ? (
                <span style={{ fontSize: '0.74rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34D399', padding: '0.2rem 0.65rem', borderRadius: 9999 }}>
                  ✓ Verified Employer
                </span>
              ) : (
                <span style={{ fontSize: '0.74rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#FCD34D', padding: '0.2rem 0.65rem', borderRadius: 9999 }}>
                  ⏱️ Pending Verification
                </span>
              )}
            </div>
            <span className={styles.userEmail}>
              {user?.email} • {companyForm.designation || 'Hiring Manager'}
            </span>
            <span className={`${styles.roleBadge} ${styles.roleRecruiter}`}>
              🏢 Employer Management (West Godavari District)
            </span>
          </div>
        </div>

        <div className={styles.bannerActions}>
          <LanguageSelector />
          <NotificationBell />

          <button 
            type="button" 
            className={styles.actionBtn}
            onClick={() => setIsPostJobOpen(true)}
          >
            <span>+</span> {t('recruiter.postNewJob', 'Post New Opening')}
          </button>
          <Link to="/" className={styles.homeBtn}>
            {t('nav.home', 'Public Portal')}
          </Link>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            {t('nav.signOut', 'Sign Out')}
          </button>
        </div>
      </div>

      {/* Database Disconnection Notice (Honest Development Status) */}
      {isDbUnavailable && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>⚠️</span>
          <div style={{ fontSize: '0.86rem', color: '#FCD34D', lineHeight: 1.45 }}>
            <strong>MongoDB Atlas Development Mode:</strong> Persistent recruiter metrics and candidate tracking require an active Atlas connection (scheduled for the database integration phase). Active job postings remain fully accessible via the local development store.
          </div>
        </div>
      )}

      {/* Recruiter Section Navigation Tabs (Phase 8) */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span>📊</span> {t('recruiter.overviewTab', 'Overview & Analytics')}
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'jobs' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <span>💼</span> {t('recruiter.manageListings', 'My Job Listings')} ({recruiterJobs.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'pipeline' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <span>👥</span> {t('recruiter.candidatePipeline', 'Applicant Pipeline')} {selectedJob && `(${selectedJob.title})`}
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'interviews' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('interviews')}
        >
          <span>🗓️</span> {t('recruiter.scheduledInterviews', 'Interviews')} ({scheduledInterviews.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'company' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('company')}
        >
          <span>🏢</span> {t('recruiter.companyProfile', 'Company Profile & Settings')}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & ANALYTICS                               */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <>
          {/* Metrics Grid */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>📢</div>
              <div className={styles.metricContent}>
                <span className={styles.metricNumber}>
                  {summaryData?.metrics?.totalJobs ?? recruiterJobs.length}
                </span>
                <span className={styles.metricLabel}>{t('recruiter.totalJobsPosted', 'Total Vacancies Posted')}</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>📩</div>
              <div className={styles.metricContent}>
                <span className={styles.metricNumber}>
                  {isDbUnavailable ? '—' : (summaryData?.metrics?.totalApplicants ?? '0')}
                </span>
                <span className={styles.metricLabel}>
                  {isDbUnavailable ? 'Applications (DB Offline)' : t('recruiter.totalApplications', 'Total Applications')}
                </span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>🎯</div>
              <div className={styles.metricContent}>
                <span className={styles.metricNumber}>
                  {isDbUnavailable ? '—' : (summaryData?.metrics?.shortlistedCount ?? '0')}
                </span>
                <span className={styles.metricLabel}>{t('recruiter.shortlistedCandidates', 'Shortlisted Candidates')}</span>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>🗓️</div>
              <div className={styles.metricContent}>
                <span className={styles.metricNumber}>
                  {isDbUnavailable ? '—' : (summaryData?.metrics?.interviewsScheduledCount ?? scheduledInterviews.length)}
                </span>
                <span className={styles.metricLabel}>{t('jobseeker.interviewsScheduled', 'Interviews Scheduled')}</span>
              </div>
            </div>
          </div>

          <div className={styles.panelsGrid}>
            {/* Left: Pipeline Analytics & Status Breakdown */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <span>📈</span> Application Pipeline Distribution
                </h2>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
                  onClick={fetchSummaryAndAnalytics}
                >
                  Refresh Analytics ⟳
                </button>
              </div>

              {isLoadingMetrics ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                  Loading recruitment analytics...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Conversion Rate Badges */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 8, padding: '0.85rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#22D3EE' }}>
                        {analyticsData?.conversionRates?.shortlistRate ?? 0}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>Shortlist Rate</div>
                    </div>

                    <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(167, 139, 250, 0.25)', borderRadius: 8, padding: '0.85rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#C4B5FD' }}>
                        {analyticsData?.conversionRates?.interviewRate ?? 0}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>Interview Rate</div>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8, padding: '0.85rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34D399' }}>
                        {analyticsData?.conversionRates?.hireRate ?? 0}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>Hire Rate</div>
                    </div>
                  </div>

                  {/* Status Breakdown Pills */}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.65rem' }}>
                      Active Stage Breakdown
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
                      {APPLICATION_STATUS_OPTIONS.map((st) => {
                        const count = analyticsData?.statusDistribution?.[st] ?? summaryData?.metrics?.[`${st.toLowerCase().replace(/\s+/g, '')}Count`] ?? 0;
                        return (
                          <div
                            key={st}
                            style={{
                              padding: '0.65rem',
                              borderRadius: 8,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.82rem',
                              ...getStatusBadgeStyle(st),
                            }}
                          >
                            <span>{st}</span>
                            <strong>{count}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Per-job applications summary */}
                  {analyticsData?.jobsAnalytics && analyticsData.jobsAnalytics.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.5rem' }}>
                        Applications by Vacancy
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {analyticsData.jobsAnalytics.map((j) => (
                          <div
                            key={j.jobId}
                            style={{
                              background: 'rgba(11, 16, 32, 0.5)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: 6,
                              padding: '0.65rem 0.85rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.85rem',
                            }}
                          >
                            <div>
                              <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{j.title}</span>
                              <span style={{ color: '#94A3B8', fontSize: '0.78rem', marginLeft: '0.5rem' }}>📍 {j.town}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                              <span style={{ color: '#60A5FA' }}>👥 {j.applicantCount} applicants</span>
                              <span style={{ color: '#C4B5FD' }}>🗓️ {j.interviewCount} interviews</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Quick Actions & District Reach */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <span>⚡</span> Quick Management
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ background: 'rgba(11, 16, 32, 0.6)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    🏢 Employer: {companyForm.companyName || 'Not Set'}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#94A3B8', lineHeight: 1.45 }}>
                    Location: 📍 {companyForm.town || 'Bhimavaram'}, {companyForm.location || 'West Godavari'}<br />
                    Industry: {companyForm.industry || 'IT & Tech'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('company')}
                    style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginTop: '0.35rem', fontWeight: 600 }}
                  >
                    Edit Employer Profile →
                  </button>
                </div>

                <div style={{ background: 'rgba(124, 58, 237, 0.12)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                  <div style={{ fontWeight: 700, color: '#C4B5FD', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                    🗓️ Active Interview Pipeline
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    {scheduledInterviews.length} upcoming interview session(s) scheduled with West Godavari candidates.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('interviews')}
                    style={{ background: 'none', border: 'none', color: '#C4B5FD', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginTop: '0.35rem', fontWeight: 600 }}
                  >
                    View Interview Calendar →
                  </button>
                </div>

                <button 
                  type="button" 
                  className={styles.actionBtn}
                  onClick={() => setIsPostJobOpen(true)}
                  style={{ width: '100%' }}
                >
                  + Post New Vacancy Opening
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MY JOB LISTINGS (CRUD & STATUS CONTROLS)            */}
      {/* ========================================================= */}
      {activeTab === 'jobs' && (
        <div className={styles.panel} style={{ width: '100%' }}>
          <div className={styles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 className={styles.panelTitle}>
                <span>💼</span> Manage Job Listings ({filteredJobs.length})
              </h2>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {['all', 'published', 'closed'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setJobFilter(f)}
                    style={{
                      background: jobFilter === f ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                      border: jobFilter === f ? '1px solid #8B5CF6' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: jobFilter === f ? '#FFFFFF' : '#94A3B8',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="button" 
              className={styles.actionBtn}
              onClick={() => setIsPostJobOpen(true)}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.95rem' }}
            >
              + Create New Opening
            </button>
          </div>

          {isLoadingJobs ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              Loading your vacancy listings...
            </div>
          ) : filteredJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredJobs.map((job) => {
                const jobId = job.id || job._id;
                const isClosed = job.status === 'closed';

                return (
                  <div 
                    key={jobId} 
                    style={{ 
                      background: 'rgba(11, 16, 32, 0.65)', 
                      border: '1px solid rgba(255, 255, 255, 0.06)', 
                      borderRadius: 10, 
                      padding: '1.25rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      flexWrap: 'wrap', 
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                          {job.title}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.55rem',
                            borderRadius: 9999,
                            background: isClosed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isClosed ? '#F87171' : '#34D399',
                            border: isClosed ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          ● {isClosed ? 'Closed' : 'Active'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#A78BFA' }}>
                        🏢 {job.company} • 📍 {job.town}, AP • 💼 {job.employmentType} • 💰 {job.salary || 'Salary Disclosed Upon Request'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.35rem', maxWidth: '650px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.description}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleViewApplicants(job)}
                        style={{
                          background: 'rgba(124, 58, 237, 0.25)',
                          border: '1px solid rgba(167, 139, 250, 0.4)',
                          color: '#FFFFFF',
                          padding: '0.4rem 0.85rem',
                          borderRadius: 6,
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        👥 View Applicants
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingJob({ ...job })}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#CBD5E1',
                          padding: '0.4rem 0.75rem',
                          borderRadius: 6,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleJobStatus(job)}
                        style={{
                          background: isClosed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          border: isClosed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                          color: isClosed ? '#34D399' : '#FCD34D',
                          padding: '0.4rem 0.75rem',
                          borderRadius: 6,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isClosed ? 'Publish' : 'Close'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteJob(jobId, job.title)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#EF4444',
                          padding: '0.4rem 0.75rem',
                          borderRadius: 6,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        title="Delete vacancy"
                      >
                        Delete ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(11, 16, 32, 0.4)', borderRadius: 12 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
              <h3 style={{ color: '#F8FAFC', fontSize: '1.1rem', marginBottom: '0.35rem' }}>No Listings Found</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                You do not have any job postings matching this filter.
              </p>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setIsPostJobOpen(true)}
              >
                + Post Your First Opening
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: APPLICANT PIPELINE                                 */}
      {/* ========================================================= */}
      {activeTab === 'pipeline' && (
        <div className={styles.panel} style={{ width: '100%' }}>
          <div className={styles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 className={styles.panelTitle}>
                <span>👥</span> Candidate Pipeline
              </h2>
              {selectedJob && (
                <span style={{ fontSize: '0.85rem', color: '#C4B5FD', background: 'rgba(124, 58, 237, 0.2)', padding: '0.2rem 0.65rem', borderRadius: 6 }}>
                  Filtering for "{selectedJob.title}"
                </span>
              )}
            </div>

            {selectedJob && (
              <button
                type="button"
                onClick={() => {
                  setSelectedJob(null);
                  setJobApplications([]);
                }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Clear Filter ✕
              </button>
            )}
          </div>

          {!selectedJob ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Select a job opening below to review candidates who applied:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center' }}>
                {recruiterJobs.map((j) => (
                  <button
                    key={j.id || j._id}
                    type="button"
                    onClick={() => handleViewApplicants(j)}
                    style={{
                      background: 'rgba(124, 58, 237, 0.15)',
                      border: '1px solid rgba(167, 139, 250, 0.35)',
                      color: '#F8FAFC',
                      padding: '0.6rem 1rem',
                      borderRadius: 8,
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    💼 {j.title} ({j.town}) →
                  </button>
                ))}
              </div>
            </div>
          ) : isLoadingApps ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              Loading candidate applications...
            </div>
          ) : jobApplications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {jobApplications.map((app) => {
                const candidate = app.applicant || {};
                const candidateProfile = candidate.jobseekerProfile || {};
                const appId = app.id || app._id;

                return (
                  <div
                    key={appId}
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 10,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC' }}>
                          {candidate.name || 'Candidate'}
                          {candidateProfile.isFresher && (
                            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '0.15rem 0.5rem', borderRadius: 999, marginLeft: '0.5rem' }}>
                              🎓 Fresher Friendly
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#A78BFA' }}>
                          {candidateProfile.headline || 'Job Seeker'} • 📍 {candidateProfile.location || 'West Godavari'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                          ✉️ {candidate.email} {candidateProfile.phone && `• 📞 ${candidateProfile.phone}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.65rem',
                            borderRadius: 999,
                            ...getStatusBadgeStyle(app.status),
                          }}
                        >
                          ● {app.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(app)}
                          style={{
                            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                            border: 'none',
                            color: '#FFF',
                            padding: '0.4rem 0.85rem',
                            borderRadius: 6,
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Update Status / Interview 🗓️
                        </button>
                      </div>
                    </div>

                    {/* Candidate Skills preview */}
                    {candidateProfile.skills && candidateProfile.skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {candidateProfile.skills.slice(0, 6).map((sk, idx) => (
                          <span key={idx} style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.06)', color: '#CBD5E1', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Cover Letter preview */}
                    {app.coverLetter && (
                      <div style={{ fontSize: '0.82rem', color: '#CBD5E1', background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.85rem', borderRadius: 6 }}>
                        <strong>Candidate Note:</strong> "{app.coverLetter}"
                      </div>
                    )}

                    {/* Interview scheduled info */}
                    {app.status === 'Interview Scheduled' && app.interviewDetails && (
                      <div style={{ fontSize: '0.82rem', color: '#C4B5FD', background: 'rgba(124, 58, 237, 0.16)', border: '1px solid rgba(167, 139, 250, 0.35)', padding: '0.65rem 0.85rem', borderRadius: 6 }}>
                        📅 Scheduled Session: <strong>{app.interviewDetails.interviewDate} {app.interviewDetails.interviewTime}</strong>
                        {app.interviewDetails.meetingLink && (
                          <span> • <a href={app.interviewDetails.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#DDD6FE', textDecoration: 'underline' }}>Meeting Link ↗</a></span>
                        )}
                        {app.interviewDetails.location && <span> • 📍 Venue: {app.interviewDetails.location}</span>}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.75rem', color: '#64748B' }}>
                      <span>Submitted: {new Date(app.createdAt || app.submissionTimestamp || Date.now()).toLocaleDateString()}</span>
                      {app.resumeUrl && (
                        <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#818CF8' }}>
                          View Candidate Resume Link ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
              No applications received for this job opening yet.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: INTERVIEW MANAGEMENT                               */}
      {/* ========================================================= */}
      {activeTab === 'interviews' && (
        <div className={styles.panel} style={{ width: '100%' }}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <span>🗓️</span> Scheduled Candidate Interviews ({scheduledInterviews.length})
            </h2>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
              onClick={fetchInterviews}
            >
              Refresh Sessions ⟳
            </button>
          </div>

          {isLoadingInterviews ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              Loading scheduled interview sessions...
            </div>
          ) : scheduledInterviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {scheduledInterviews.map((intApp) => {
                const appId = intApp.id || intApp._id;
                const candidate = intApp.candidate || {};
                const job = intApp.job || {};
                const int = intApp.interviewDetails || {};

                return (
                  <div
                    key={appId}
                    style={{
                      background: 'rgba(124, 58, 237, 0.1)',
                      border: '1px solid rgba(167, 139, 250, 0.35)',
                      borderRadius: 10,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                          Candidate: {candidate.name || 'Candidate'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#C4B5FD' }}>
                          Position: <strong>{job.title || 'Role'}</strong> • 🏢 {job.company || 'Employer'} (📍 {job.town}, AP)
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                          ✉️ {candidate.email} {candidate.phone && `• 📞 ${candidate.phone}`}
                        </div>
                      </div>

                      <div style={{ background: 'rgba(124, 58, 237, 0.25)', border: '1px solid rgba(167, 139, 250, 0.4)', borderRadius: 8, padding: '0.5rem 0.85rem', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>
                          📅 {int.interviewDate || 'Date Disclosed Soon'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#DDD6FE' }}>
                          ⏰ {int.interviewTime || 'Time TBA'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#CBD5E1', background: 'rgba(11, 16, 32, 0.5)', padding: '0.75rem', borderRadius: 8 }}>
                      {int.meetingLink && (
                        <div>
                          🔗 <strong>Meeting URL:</strong>{' '}
                          <a href={int.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#A78BFA', textDecoration: 'underline' }}>
                            Join Call Link ↗
                          </a>
                        </div>
                      )}
                      {int.location && (
                        <div>
                          📍 <strong>Location / Venue:</strong> {int.location}
                        </div>
                      )}
                      {int.notes && (
                        <div style={{ width: '100%', marginTop: '0.25rem' }}>
                          💬 <strong>Candidate Instructions:</strong> {int.notes}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal({ ...intApp, applicant: candidate, job })}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Reschedule / Update Outcome →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(11, 16, 32, 0.4)', borderRadius: 12 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🗓️</div>
              <h3 style={{ color: '#F8FAFC', fontSize: '1.1rem', marginBottom: '0.35rem' }}>No Interviews Scheduled Yet</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                When you review candidate submissions and schedule an interview in the Applicant Pipeline, sessions will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: COMPANY PROFILE & EMPLOYER SETTINGS                 */}
      {/* ========================================================= */}
      {activeTab === 'company' && (
        <div className={styles.panel} style={{ width: '100%' }}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <span>🏢</span> Employer & Company Profile Settings
            </h2>
            <div style={{ fontSize: '0.85rem' }}>
              Verification Status:{' '}
              {isEmployerVerified ? (
                <span style={{ color: '#34D399', fontWeight: 700 }}>✓ Verified Regional Employer</span>
              ) : (
                <span style={{ color: '#FCD34D', fontWeight: 600 }}>⏱️ Pending Admin Verification</span>
              )}
            </div>
          </div>

          <form onSubmit={handleCompanyProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            {companyError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '0.85rem', color: '#FCA5A5', fontSize: '0.88rem' }}>
                ⚠️ {companyError}
              </div>
            )}

            {companySuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: 8, padding: '0.85rem', color: '#6EE7B7', fontSize: '0.88rem' }}>
                {companySuccess}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  placeholder="e.g. Delta Software Solutions"
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Industry / Business Category *
                </label>
                <select
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
                >
                  <option value="Information Technology">Information Technology & Software</option>
                  <option value="Aquaculture & Agriculture">Aquaculture, Marine & Agriculture</option>
                  <option value="Education & Academics">Education & Colleges</option>
                  <option value="Healthcare & Hospitals">Healthcare & Pharma</option>
                  <option value="Retail & Trade">Retail, Wholesale & Logistics</option>
                  <option value="Manufacturing & Trades">Manufacturing & Technical Engineering</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Company Website URL
                </label>
                <input
                  type="url"
                  value={companyForm.companyWebsite}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyWebsite: e.target.value })}
                  placeholder="https://yourcompany.in"
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Company Logo URL
                </label>
                <input
                  type="url"
                  value={companyForm.logoUrl}
                  onChange={(e) => setCompanyForm({ ...companyForm, logoUrl: e.target.value })}
                  placeholder="https://yourcompany.in/logo.png"
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Recruiter Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  placeholder="e.g. Lakshman Varma"
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Recruiter Professional Designation
                </label>
                <input
                  type="text"
                  value={companyForm.designation}
                  onChange={(e) => setCompanyForm({ ...companyForm, designation: e.target.value })}
                  placeholder="e.g. Talent Acquisition Lead"
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Primary West Godavari Town *
                </label>
                <select
                  value={companyForm.town}
                  onChange={(e) => setCompanyForm({ ...companyForm, town: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
                >
                  {WEST_GODAVARI_TOWNS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Public Business Phone
                </label>
                <input
                  type="tel"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  placeholder="+91 9848012345"
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Public Hiring Email
                </label>
                <input
                  type="email"
                  value={companyForm.contactEmail}
                  onChange={(e) => setCompanyForm({ ...companyForm, contactEmail: e.target.value })}
                  placeholder="careers@company.in"
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                Office / Regional Address in West Godavari
              </label>
              <input
                type="text"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                placeholder="Building name, Street, Landmark"
                style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                Company Overview & Mission
              </label>
              <textarea
                rows={4}
                value={companyForm.companyDescription}
                onChange={(e) => setCompanyForm({ ...companyForm, companyDescription: e.target.value })}
                placeholder="Introduce your company culture, technology stack, and regional presence in Andhra Pradesh..."
                style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                className={styles.actionBtn}
                disabled={isSavingCompany}
              >
                {isSavingCompany ? 'Saving Profile...' : 'Save Employer Profile ✓'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT JOB OPENING                                   */}
      {/* ========================================================= */}
      {editingJob && (
        <Modal
          isOpen={Boolean(editingJob)}
          onClose={() => setEditingJob(null)}
          title={`Edit Vacancy: ${editingJob.title}`}
          subtitle="Update role specifications, requirements, compensation, and publication status."
          maxWidth="680px"
        >
          <form onSubmit={handleEditJobSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingJob.company}
                  onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Mandal / Town *
                </label>
                <select
                  value={editingJob.town}
                  onChange={(e) => setEditingJob({ ...editingJob, town: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem', color: '#FFF' }}
                >
                  {WEST_GODAVARI_TOWNS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Career Category *
                </label>
                <select
                  value={editingJob.category}
                  onChange={(e) => setEditingJob({ ...editingJob, category: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem', color: '#FFF' }}
                >
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Employment Type
                </label>
                <select
                  value={editingJob.employmentType}
                  onChange={(e) => setEditingJob({ ...editingJob, employmentType: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem', color: '#FFF' }}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  Publication Status
                </label>
                <select
                  value={editingJob.status}
                  onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem', color: '#FFF' }}
                >
                  <option value="published">Published (Active)</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                Salary / Compensation
              </label>
              <input
                type="text"
                value={editingJob.salary || ''}
                onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                placeholder="e.g. ₹3.5 - ₹5.0 LPA or Salary Disclosed Upon Request"
                style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem', color: '#FFF' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                Detailed Description *
              </label>
              <textarea
                rows={5}
                required
                value={editingJob.description}
                onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem', color: '#FFF', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#CBD5E1', padding: '0.6rem 1.25rem', borderRadius: 8, cursor: 'pointer' }}
                disabled={isSavingJob}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.actionBtn}
                disabled={isSavingJob}
              >
                {isSavingJob ? 'Saving Changes...' : 'Save Job Changes ✓'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL: UPDATE APPLICATION STATUS & INTERVIEW              */}
      {/* ========================================================= */}
      {statusModalApp && (
        <Modal
          isOpen={Boolean(statusModalApp)}
          onClose={() => setStatusModalApp(null)}
          title="Update Application Status & Schedule Interview"
          subtitle={`Candidate: ${statusModalApp.applicant?.name || statusModalApp.candidate?.name || 'Applicant'}`}
          maxWidth="620px"
        >
          <form onSubmit={handleSaveStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {statusError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '0.75rem', color: '#FCA5A5', fontSize: '0.85rem' }}>
                ⚠️ {statusError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                Application Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem' }}
              >
                {APPLICATION_STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                Recruiter Notes / Candidate Feedback
              </label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Optional notes visible to hiring team and candidate..."
                rows={3}
                style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#FFF', fontSize: '0.9rem', resize: 'vertical' }}
              />
            </div>

            {/* Conditional Interview Scheduling Section */}
            {newStatus === 'Interview Scheduled' && (
              <div style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(167, 139, 250, 0.35)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#C4B5FD', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📅</span> Schedule Interview Session
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', marginBottom: '0.25rem' }}>
                      Interview Date *
                    </label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 6, padding: '0.55rem', color: '#FFF', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', marginBottom: '0.25rem' }}>
                      Time (e.g. 10:30 AM IST) *
                    </label>
                    <input
                      type="text"
                      placeholder="11:00 AM"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 6, padding: '0.55rem', color: '#FFF', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', marginBottom: '0.25rem' }}>
                    Meeting Link (Google Meet / Zoom URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 6, padding: '0.55rem', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', marginBottom: '0.25rem' }}>
                    Physical Venue / Office Address (if in-person)
                  </label>
                  <input
                    type="text"
                    placeholder="Bhimavaram Tech Center, 2nd Floor"
                    value={interviewLocation}
                    onChange={(e) => setInterviewLocation(e.target.value)}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 6, padding: '0.55rem', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#E2E8F0', marginBottom: '0.25rem' }}>
                    Preparation Notes / Interview Agenda
                  </label>
                  <textarea
                    rows={2}
                    placeholder="E.g. Technical live coding round, please have your laptop ready."
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 6, padding: '0.55rem', color: '#FFF', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStatusModalApp(null)}
                style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#CBD5E1', padding: '0.6rem 1.25rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.88rem' }}
                disabled={isSavingStatus}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.actionBtn}
                style={{ fontSize: '0.88rem', padding: '0.6rem 1.25rem' }}
                disabled={isSavingStatus}
              >
                {isSavingStatus ? 'Updating...' : 'Save Application Status ✓'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Post Job Info Modal */}
      <PostJobInfoModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onShowToast={(msg) => {
          setToastType('success');
          setToastMessage(msg);
        }}
        onJobCreated={handleJobCreated}
      />

      {/* Toast notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
}
