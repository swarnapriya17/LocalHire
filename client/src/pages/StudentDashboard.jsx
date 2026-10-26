import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { jobService, applicationService } from '../services/api';
import LanguageSelector from '../components/common/LanguageSelector';
import NotificationBell from '../components/common/NotificationBell';
import styles from './Dashboard.module.css';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [totalJobs, setTotalJobs] = useState(12);
  const [applications, setApplications] = useState([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState('');
  const [isDbUnavailable, setIsDbUnavailable] = useState(false);
  const [savedCount, setSavedCount] = useState(() => {
    try {
      const stored = localStorage.getItem('localhire_saved_jobs');
      return stored ? JSON.parse(stored).length : 2;
    } catch {
      return 2;
    }
  });

  useEffect(() => {
    // 1. Fetch available regional jobs
    jobService.getJobs({ limit: 100 })
      .then((res) => {
        if (res && res.total !== undefined) {
          setTotalJobs(res.total);
        }
      })
      .catch(() => {});

    // 2. Fetch authenticated job seeker's real applications
    setIsLoadingApps(true);
    applicationService.getMyApplications()
      .then((res) => {
        if (res && Array.isArray(res.applications)) {
          setApplications(res.applications);
        }
        setIsDbUnavailable(false);
      })
      .catch((err) => {
        const msg = err.message || '';
        if (msg.includes('MongoDB') || msg.includes('DATABASE_UNAVAILABLE') || err.statusCode === 503) {
          setIsDbUnavailable(true);
        } else {
          setAppsError(msg);
        }
      })
      .finally(() => {
        setIsLoadingApps(false);
      });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Applied':
        return { background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' };
      case 'Under Review':
        return { background: '#FEF3C7', border: '1px solid #FDE68A', color: '#B45309' };
      case 'Shortlisted':
        return { background: '#E9F9F8', border: '1px solid #A7F3D0', color: '#0F766E' };
      case 'Interview Scheduled':
        return { background: '#F3EFFF', border: '1px solid #DDD6FE', color: '#7C3AED', boxShadow: '0 2px 8px rgba(124, 58, 237, 0.15)' };
      case 'Hired':
        return { background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857' };
      case 'Rejected':
        return { background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' };
      default:
        return { background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569' };
    }
  };

  const getTranslatedStatus = (status) => {
    switch (status) {
      case 'Applied': return t('status.applied', 'Applied');
      case 'Under Review': return t('status.underReview', 'Under Review');
      case 'Shortlisted': return t('status.shortlisted', 'Shortlisted');
      case 'Interview Scheduled': return t('status.interviewScheduled', 'Interview Scheduled');
      case 'Hired': return t('status.hired', 'Hired');
      case 'Rejected': return t('status.rejected', 'Not Selected');
      default: return status;
    }
  };

  return (
    <div className={styles.dashboardWrapper}>
      {/* Top Banner */}
      <div className={styles.topBanner}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className={styles.userDetails}>
            <h1 className={styles.userName}>{user?.name}</h1>
            <span className={styles.userEmail}>{user?.email}</span>
            <span className={`${styles.roleBadge} ${styles.roleJobSeeker}`}>
              🎓 {t('jobseeker.welcome', 'Verified Job Seeker')} ({t('nav.region', 'West Godavari')})
            </span>
          </div>
        </div>

        <div className={styles.bannerActions}>
          <LanguageSelector />
          <NotificationBell />

          <Link
            to="/student/ai-assistant"
            className={styles.homeBtn}
            id="btn-nav-ai-assistant"
            style={{
              background: '#F3EFFF',
              borderColor: '#DDD6FE',
              color: 'var(--accent-lavender)',
              fontWeight: 700,
            }}
          >
            ⚡ {t('ai.title', 'AI Career Assistant')}
          </Link>
          <Link
            to="/student/profile"
            className={styles.homeBtn}
            style={{
              background: '#E9F9F8',
              borderColor: '#A7F3D0',
              color: '#0F766E',
              fontWeight: 700,
            }}
          >
            👤 {t('jobseeker.profileHeadline', 'Career Profile')}
          </Link>
          <Link to="/" className={styles.homeBtn}>
            ← {t('nav.findJobs', 'Explore Vacancies')}
          </Link>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            {t('nav.signOut', 'Sign Out')}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>📋</div>
          <div className={styles.metricContent}>
            <span className={styles.metricNumber}>
              {isDbUnavailable ? '—' : applications.length}
            </span>
            <span className={styles.metricLabel}>
              {isDbUnavailable ? 'Applications (DB Offline)' : t('jobseeker.myApplications', 'Applications Submitted')}
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>❤️</div>
          <div className={styles.metricContent}>
            <span className={styles.metricNumber}>{savedCount}</span>
            <span className={styles.metricLabel}>{t('jobseeker.savedVacancies', 'Bookmarked Positions')}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>🎯</div>
          <div className={styles.metricContent}>
            <span className={styles.metricNumber}>{totalJobs}</span>
            <span className={styles.metricLabel}>{t('jobseeker.regionalOpenings', 'Regional Match Openings')}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>📍</div>
          <div className={styles.metricContent}>
            <span className={styles.metricNumber}>7</span>
            <span className={styles.metricLabel}>{t('jobseeker.mandalsCount', 'West Godavari Mandals')}</span>
          </div>
        </div>
      </div>

      {/* Panels Grid */}
      <div className={styles.panelsGrid}>
        {/* Left: Application Activity */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <span>📄</span> {t('jobseeker.myApplications', 'My Job Applications')} ({isDbUnavailable ? 'DB Disconnected' : applications.length})
            </h2>
            <Link to="/#jobs" style={{ fontSize: '0.85rem', color: 'var(--primary-teal)', textDecoration: 'none', fontWeight: 600 }}>
              {t('jobseeker.browseListings', 'Browse Listings')} →
            </Link>
          </div>

          {isLoadingApps ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              {t('jobseeker.loadingApps', 'Loading your submitted applications...')}
            </div>
          ) : isDbUnavailable ? (
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#92400E', marginBottom: '0.35rem' }}>
                {t('jobseeker.appHistoryRequiresDb', 'Application History Requires MongoDB Atlas')}
              </h3>
              <p style={{ color: '#78350F', fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                LocalHire is running with MongoDB Atlas connectivity postponed to the database integration phase. Once Atlas is reachable, all persistent application records and live status updates will automatically display here.
              </p>
              <Link to="/#jobs" className={styles.actionBtn} style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}>
                Explore Open Vacancies →
              </Link>
            </div>
          ) : applications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {applications.map((app) => {
                const appId = app.id || app._id;
                const jobTitle = app.job?.title || 'Open Position';
                const jobCompany = app.job?.company || 'Local Employer';
                const jobTown = app.job?.town || 'West Godavari';
                const hasInterview = app.status === 'Interview Scheduled' && app.interviewDetails;

                return (
                  <div
                    key={appId}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E1EDF3',
                      borderRadius: 10,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: '0 2px 8px rgba(23, 54, 93, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                          {jobTitle}
                        </h3>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          🏢 {jobCompany} • 📍 {jobTown}, AP
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          padding: '0.3rem 0.75rem',
                          borderRadius: 9999,
                          ...getStatusBadgeStyle(app.status),
                        }}
                      >
                        ● {app.status}
                      </span>
                    </div>

                    {/* Interview Notification Banner */}
                    {hasInterview && (
                      <div
                        style={{
                          background: '#F3EFFF',
                          border: '1px solid #DDD6FE',
                          borderRadius: 8,
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}
                      >
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>🎉</span> Interview Scheduled with Hiring Team
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                          {app.interviewDetails.interviewDate && (
                            <span>📅 Date: <strong>{app.interviewDetails.interviewDate}</strong></span>
                          )}
                          {app.interviewDetails.interviewTime && (
                            <span>⏰ Time: <strong>{app.interviewDetails.interviewTime}</strong></span>
                          )}
                          {app.interviewDetails.location && (
                            <span>📍 Venue: <strong>{app.interviewDetails.location}</strong></span>
                          )}
                        </div>
                        {app.interviewDetails.meetingLink && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <a
                              href={app.interviewDetails.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#7C3AED', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'underline' }}
                            >
                              Join Video Meeting Link ↗
                            </a>
                          </div>
                        )}
                        {app.interviewDetails.notes && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            💬 Recruiter Note: {app.interviewDetails.notes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Optional Cover letter & recruiter notes preview */}
                    {app.recruiterNotes && app.status !== 'Interview Scheduled' && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', background: '#F5FAFC', border: '1px solid #E1EDF3', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                        💬 Recruiter Note: <em>"{app.recruiterNotes}"</em>
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid #E1EDF3' }}>
                      <span>Submitted on: {new Date(app.createdAt || app.submissionTimestamp || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary-teal)', textDecoration: 'none', fontWeight: 600 }}
                        >
                          View Submitted Resume Link ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: '#F5FAFC', borderRadius: 12, padding: '2rem', textAlign: 'center', border: '1px solid #E1EDF3' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                No Active Applications Yet
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Browse active IT, non-IT, and fresher openings across Bhimavaram, Eluru, Tadepalligudem, and Tanuku to submit your first application.
              </p>
              <Link to="/#jobs" className={styles.actionBtn}>
                Find Jobs in West Godavari
              </Link>
            </div>
          )}
        </div>

        {/* Right: Career Guidance & Profile Readiness */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <span>🚀</span> Career Preparation
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: '#F3EFFF', border: '1px solid #DDD6FE', borderRadius: 10, padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#7C3AED' }}>
                  💼 Profile Completeness & Career
                </span>
                <span style={{ fontSize: '0.72rem', background: '#8B5CF6', color: '#FFF', padding: '0.15rem 0.5rem', borderRadius: 9999, fontWeight: 700 }}>
                  Phase 6
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                Maintain your education, skills, fresher status, West Godavari job preferences, and recruiter privacy controls.
              </p>
              <Link
                to="/student/profile"
                className={styles.actionBtn}
                style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
              >
                Open Career Profile Editor →
              </Link>
            </div>

            <div style={{ background: '#F5FAFC', border: '1px solid #E1EDF3', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                📝 ATS Resume Playbook
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Review formatting tips and keyword alignment for regional and remote applications.
              </p>
            </div>

            <div style={{ background: '#E9F9F8', border: '1px solid #A7F3D0', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F766E', marginBottom: '0.25rem' }}>
                🎓 Fresher Traineeships
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Explore 0-1 year openings requiring zero prior corporate experience.
              </p>
            </div>

            <div style={{ background: '#F3EFFF', border: '1px solid #DDD6FE', borderRadius: 10, padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#7C3AED' }}>
                  ⚡ AI Career Assistant
                </span>
                <span style={{ fontSize: '0.72rem', background: 'var(--primary-teal)', color: '#FFF', padding: '0.15rem 0.5rem', borderRadius: 9999, fontWeight: 700 }}>
                  Phase 10
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                Interactive career chat, ATS resume review, 4-week skill-gap roadmaps, and mock interview practice.
              </p>
              <Link
                to="/student/ai-assistant"
                className={styles.actionBtn}
                id="btn-launch-ai-assistant"
                style={{
                  width: '100%',
                  fontSize: '0.85rem',
                  padding: '0.55rem 1rem',
                  background: 'var(--primary-teal)',
                }}
              >
                Launch AI Career Assistant →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
