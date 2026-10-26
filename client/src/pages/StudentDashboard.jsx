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
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(6, 182, 212, 0.4))',
              borderColor: 'rgba(6, 182, 212, 0.5)',
              color: '#FFFFFF',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.25)',
            }}
          >
            ⚡ {t('ai.title', 'AI Career Assistant')}
          </Link>
          <Link
            to="/student/profile"
            className={styles.homeBtn}
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(76, 29, 149, 0.45))',
              borderColor: 'rgba(167, 139, 250, 0.4)',
              color: '#FFFFFF'
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
            <Link to="/#jobs" style={{ fontSize: '0.85rem', color: '#A78BFA', textDecoration: 'none' }}>
              {t('jobseeker.browseListings', 'Browse Listings')} →
            </Link>
          </div>

          {isLoadingApps ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
              {t('jobseeker.loadingApps', 'Loading your submitted applications...')}
            </div>
          ) : isDbUnavailable ? (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 10, padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FCD34D', marginBottom: '0.35rem' }}>
                {t('jobseeker.appHistoryRequiresDb', 'Application History Requires MongoDB Atlas')}
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
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
                      background: 'rgba(11, 16, 32, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 10,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.2rem' }}>
                          {jobTitle}
                        </h3>
                        <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
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
                          background: 'rgba(124, 58, 237, 0.16)',
                          border: '1px solid rgba(167, 139, 250, 0.4)',
                          borderRadius: 8,
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}
                      >
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#C4B5FD', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>🎉</span> Interview Scheduled with Hiring Team
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
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
                              style={{ color: '#A78BFA', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'underline' }}
                            >
                              Join Video Meeting Link ↗
                            </a>
                          </div>
                        )}
                        {app.interviewDetails.notes && (
                          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                            💬 Recruiter Note: {app.interviewDetails.notes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Optional Cover letter & recruiter notes preview */}
                    {app.recruiterNotes && app.status !== 'Interview Scheduled' && (
                      <div style={{ fontSize: '0.8rem', color: '#CBD5E1', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                        💬 Recruiter Note: <em>"{app.recruiterNotes}"</em>
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <span>Submitted on: {new Date(app.createdAt || app.submissionTimestamp || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#818CF8', textDecoration: 'none' }}
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
            <div style={{ background: 'rgba(11, 16, 32, 0.6)', borderRadius: 12, padding: '2rem', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.4rem' }}>
                No Active Applications Yet
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
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
            <div style={{ background: 'rgba(124, 58, 237, 0.16)', border: '1px solid rgba(167, 139, 250, 0.35)', borderRadius: 10, padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#C4B5FD' }}>
                  💼 Profile Completeness & Career
                </span>
                <span style={{ fontSize: '0.72rem', background: '#7C3AED', color: '#FFF', padding: '0.15rem 0.5rem', borderRadius: 9999, fontWeight: 700 }}>
                  Phase 6
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94A3B8', lineHeight: 1.45, marginBottom: '0.85rem' }}>
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

            <div style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#C4B5FD', marginBottom: '0.25rem' }}>
                📝 ATS Resume Playbook
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                Review formatting tips and keyword alignment for regional and remote applications.
              </p>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#34D399', marginBottom: '0.25rem' }}>
                🎓 Fresher Traineeships
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                Explore 0-1 year openings requiring zero prior corporate experience.
              </p>
            </div>

            <div style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: 10, padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#67E8F9' }}>
                  ⚡ AI Career Assistant
                </span>
                <span style={{ fontSize: '0.72rem', background: '#0891B2', color: '#FFF', padding: '0.15rem 0.5rem', borderRadius: 9999, fontWeight: 700 }}>
                  Phase 10
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.45, marginBottom: '0.85rem' }}>
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
                  background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
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
