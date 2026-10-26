import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { adminService, healthService } from '../services/api';
import LanguageSelector from '../components/common/LanguageSelector';
import NotificationBell from '../components/common/NotificationBell';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Active Tab state: 'overview' | 'users' | 'verifications' | 'moderation' | 'activity'
  const [activeTab, setActiveTab] = useState('overview');

  // Database & Health state
  const [dbUnavailable, setDbUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  // Overview Tab data
  const [summary, setSummary] = useState(null);

  // User Management state
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [userFilters, setUserFilters] = useState({ search: '', role: '', accountStatus: '' });

  // Employer Verification state
  const [employers, setEmployers] = useState([]);
  const [verificationPagination, setVerificationPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [verificationFilter, setVerificationFilter] = useState('pending');

  // Job Moderation state
  const [jobs, setJobs] = useState([]);
  const [jobPagination, setJobPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [jobFilters, setJobFilters] = useState({ search: '', moderationStatus: '', status: '' });

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modal State for confirmations / reasons
  const [modalConfig, setModalConfig] = useState(null);
  // { title, message, requireReason, reasonPlaceholder, confirmText, confirmAction }
  const [modalReason, setModalReason] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 1. Fetch Overview Data
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setDbUnavailable(false);
    try {
      const res = await adminService.getSummary();
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      if (err.status === 503 || err.code === 'DATABASE_UNAVAILABLE') {
        setDbUnavailable(true);
      } else {
        showNotification(err.message || 'Failed to load administrative summary', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Users
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        page,
        limit: 10,
        role: userFilters.role || undefined,
        accountStatus: userFilters.accountStatus || undefined,
        search: userFilters.search || undefined,
      });
      if (res.success) {
        setUsers(res.data || []);
        setUserPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      if (err.status === 503 || err.code === 'DATABASE_UNAVAILABLE') {
        setDbUnavailable(true);
      } else {
        showNotification(err.message || 'Failed to retrieve users', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [userFilters]);

  // 3. Fetch Verification Queue
  const fetchVerifications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getVerificationQueue({
        page,
        limit: 10,
        status: verificationFilter || undefined,
      });
      if (res.success) {
        setEmployers(res.data || []);
        setVerificationPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      if (err.status === 503 || err.code === 'DATABASE_UNAVAILABLE') {
        setDbUnavailable(true);
      } else {
        showNotification(err.message || 'Failed to retrieve verification queue', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [verificationFilter]);

  // 4. Fetch Moderation Queue
  const fetchJobs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getJobsForModeration({
        page,
        limit: 10,
        moderationStatus: jobFilters.moderationStatus || undefined,
        status: jobFilters.status || undefined,
        search: jobFilters.search || undefined,
      });
      if (res.success) {
        setJobs(res.data || []);
        setJobPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      if (err.status === 503 || err.code === 'DATABASE_UNAVAILABLE') {
        setDbUnavailable(true);
      } else {
        showNotification(err.message || 'Failed to retrieve jobs for moderation', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [jobFilters]);

  // 5. Fetch Audit Logs
  const fetchAuditLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs({ page, limit: 15 });
      if (res.success) {
        setAuditLogs(res.data || []);
        setAuditPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      if (err.status === 503 || err.code === 'DATABASE_UNAVAILABLE') {
        setDbUnavailable(true);
      } else {
        showNotification(err.message || 'Failed to retrieve activity audit logs', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger appropriate fetch on tab change
  useEffect(() => {
    if (activeTab === 'overview') fetchSummary();
    if (activeTab === 'users') fetchUsers(1);
    if (activeTab === 'verifications') fetchVerifications(1);
    if (activeTab === 'moderation') fetchJobs(1);
    if (activeTab === 'activity') fetchAuditLogs(1);
  }, [activeTab, fetchSummary, fetchUsers, fetchVerifications, fetchJobs, fetchAuditLogs]);

  // Open generic confirmation modal
  const openActionModal = ({ title, message, requireReason = false, reasonPlaceholder = '', confirmText = 'Confirm', onConfirm }) => {
    setModalReason('');
    setModalConfig({
      title,
      message,
      requireReason,
      reasonPlaceholder,
      confirmText,
      confirmAction: onConfirm,
    });
  };

  const closeModal = () => {
    setModalConfig(null);
    setModalReason('');
  };

  const handleModalSubmit = async () => {
    if (!modalConfig?.confirmAction) return;
    setActionLoading(true);
    try {
      await modalConfig.confirmAction(modalReason);
      closeModal();
    } catch (err) {
      showNotification(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // User Actions: Suspend / Reactivate
  const handleToggleUserStatus = (targetUser) => {
    const isSuspending = targetUser.accountStatus === 'active';
    const nextStatus = isSuspending ? 'suspended' : 'active';

    openActionModal({
      title: isSuspending ? `Suspend User: ${targetUser.name}` : `Reactivate User: ${targetUser.name}`,
      message: isSuspending
        ? 'Suspended users are blocked from logging in or modifying platform resources. Please specify an administrative reason.'
        : 'Reactivating this user will restore their access to LocalHire. Confirm reactivation?',
      requireReason: isSuspending,
      reasonPlaceholder: isSuspending ? 'e.g., Policy violation, fraudulent postings, etc.' : 'Optional reactivation note',
      confirmText: isSuspending ? 'Suspend Account' : 'Reactivate Account',
      onConfirm: async (reason) => {
        const res = await adminService.updateUserStatus(targetUser._id, {
          accountStatus: nextStatus,
          reason,
        });
        if (res.success) {
          showNotification(`Account ${targetUser.name} marked ${nextStatus}`);
          fetchUsers(userPagination.page);
        }
      },
    });
  };

  // Employer Verification Actions: Approve / Reject
  const handleReviewVerification = (employer, status) => {
    const isApprove = status === 'approved';
    const companyTitle = employer.recruiterProfile?.companyName || employer.name;

    openActionModal({
      title: isApprove ? `Approve Verification: ${companyTitle}` : `Reject Verification: ${companyTitle}`,
      message: isApprove
        ? `Grant verified employer badge to ${companyTitle}? This communicates trust to all local job seekers in West Godavari.`
        : `Reject verification for ${companyTitle}? Provide an administrative reason explaining what documentation or proof is missing.`,
      requireReason: !isApprove,
      reasonPlaceholder: isApprove ? 'e.g. Verified registration documents' : 'e.g., Unable to verify GST / physical office in West Godavari',
      confirmText: isApprove ? 'Approve Employer' : 'Reject Verification',
      onConfirm: async (reason) => {
        const res = await adminService.reviewEmployerVerification(employer._id, {
          status,
          reason,
        });
        if (res.success) {
          showNotification(`Employer verification ${status} for ${companyTitle}`);
          fetchVerifications(verificationPagination.page);
        }
      },
    });
  };

  // Job Moderation Actions: Approve / Flag / Reject / Unpublish
  const handleModerateJob = (job, action) => {
    const actionTitles = {
      approve: 'Approve Job Listing',
      flag: 'Flag Job Listing for Review',
      reject: 'Reject Job Listing',
      unpublish: 'Unpublish Job Listing',
    };

    openActionModal({
      title: `${actionTitles[action]}: ${job.title}`,
      message: `Are you sure you want to ${action} this listing for ${job.company}?`,
      requireReason: action === 'flag' || action === 'reject',
      reasonPlaceholder: 'Reason or notes for this moderation action',
      confirmText: action.toUpperCase(),
      onConfirm: async (notes) => {
        const res = await adminService.moderateJob(job._id, { action, notes });
        if (res.success) {
          showNotification(`Job listing '${job.title}' ${action}ed successfully`);
          fetchJobs(jobPagination.page);
        }
      },
    });
  };

  return (
    <div className={styles.dashboardWrapper}>
      {/* Top Banner */}
      <header className={styles.topBanner}>
        <div className={styles.userInfo}>
          <div className={styles.avatar} id="admin-badge-avatar">
            🛡️
          </div>
          <div className={styles.userDetails}>
            <h1 className={styles.userName} id="admin-header-title">{user?.name || 'Administrator'}</h1>
            <span className={styles.userEmail}>{user?.email}</span>
            <span className={styles.roleBadge} id="admin-role-indicator">
              🛡️ System Administrator (LocalHire Core)
            </span>
          </div>
        </div>

        <div className={styles.bannerActions}>
          <LanguageSelector />
          <NotificationBell />

          <Link to="/" className={styles.homeBtn} id="btn-public-portal">
            {t('nav.home', 'Public Portal')}
          </Link>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout} id="btn-admin-logout">
            {t('nav.signOut', 'Sign Out')}
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 8,
            marginBottom: '1.5rem',
            background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            border: `1px solid ${notification.type === 'error' ? '#EF4444' : '#10B981'}`,
            color: notification.type === 'error' ? '#FCA5A5' : '#6EE7B7',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{notification.message}</span>
          <button type="button" onClick={() => setNotification(null)} style={{ color: 'inherit', fontWeight: 700 }}>
            ✕
          </button>
        </div>
      )}

      {/* Database Offline Honest Alert Banner */}
      {dbUnavailable && (
        <div className={styles.dbAlertBanner} id="admin-db-unavailable-banner">
          <div className={styles.dbAlertIcon}>⚠️</div>
          <div>
            <h3 className={styles.dbAlertTitle}>MongoDB Atlas Disconnected — Operating in Guard Mode</h3>
            <p className={styles.dbAlertDesc}>
              Administrative persistence and database-backed metrics require an active MongoDB connection.
              To preserve data integrity and prevent misleading metrics, zero counts are not fabricated. All persistent actions return <code>503 DATABASE_UNAVAILABLE</code> until the database connection is restored.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className={styles.tabsBar} aria-label="Admin Navigation Tabs">
        <button
          type="button"
          id="tab-admin-overview"
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 {t('admin.platformOverview', 'Platform Overview')}
        </button>

        <button
          type="button"
          id="tab-admin-users"
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 {t('admin.userManagement', 'User Management')}
        </button>

        <button
          type="button"
          id="tab-admin-verifications"
          className={`${styles.tabBtn} ${activeTab === 'verifications' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('verifications')}
        >
          🏢 {t('admin.verificationQueue', 'Employer Verification Queue')}
          {summary?.employersAwaitingVerification > 0 && (
            <span className={styles.tabCountBadge}>{summary.employersAwaitingVerification}</span>
          )}
        </button>

        <button
          type="button"
          id="tab-admin-moderation"
          className={`${styles.tabBtn} ${activeTab === 'moderation' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          🛡️ {t('admin.jobModeration', 'Job Moderation')}
          {summary?.pendingModerationJobs > 0 && (
            <span className={styles.tabCountBadge}>{summary.pendingModerationJobs}</span>
          )}
        </button>

        <button
          type="button"
          id="tab-admin-activity"
          className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📜 {t('admin.auditLogs', 'Audit Activity Log')}
        </button>
      </nav>

      {/* TAB 1: Platform Overview */}
      {activeTab === 'overview' && (
        <div>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <p style={{ marginTop: '0.75rem' }}>{t('common.loading', 'Loading platform metrics...')}</p>
            </div>
          ) : dbUnavailable ? (
            <div className={styles.sectionCard}>
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>🗄️</div>
                <h3>Platform Metrics Unavailable</h3>
                <p>MongoDB Atlas is currently unreachable. Connect database to view live platform metrics.</p>
              </div>
            </div>
          ) : (
            <div>
              {/* Metric Cards Grid */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>👥</div>
                  <div className={styles.metricContent}>
                    <span className={styles.metricNumber} id="metric-total-users">{summary?.totalUsers ?? 0}</span>
                    <span className={styles.metricLabel}>{t('admin.totalUsers', 'Total Users')}</span>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>🎓</div>
                  <div className={styles.metricContent}>
                    <span className={styles.metricNumber} id="metric-jobseekers">{summary?.usersByRole?.jobseeker ?? 0}</span>
                    <span className={styles.metricLabel}>{t('admin.jobSeekers', 'Job Seekers')}</span>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>🏢</div>
                  <div className={styles.metricContent}>
                    <span className={styles.metricNumber} id="metric-recruiters">{summary?.usersByRole?.recruiter ?? 0}</span>
                    <span className={styles.metricLabel}>{t('admin.employers', 'Recruiters')}</span>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>💼</div>
                  <div className={styles.metricContent}>
                    <span className={styles.metricNumber} id="metric-total-jobs">{summary?.totalJobs ?? 0}</span>
                    <span className={styles.metricLabel}>{t('admin.activeJobs', 'Total Jobs')} ({summary?.publishedJobs ?? 0} Live)</span>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>⏳</div>
                  <div className={styles.metricContent}>
                    <span className={styles.metricNumber} id="metric-pending-verifications">
                      {summary?.employersAwaitingVerification ?? 0}
                    </span>
                    <span className={styles.metricLabel}>{t('recruiter.pendingVerification', 'Awaiting Verification')}</span>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricIcon}>📝</div>
                  <div className={styles.metricContent}>
                    <span className={styles.metricNumber} id="metric-total-applications">
                      {summary?.totalApplications ?? 0}
                    </span>
                    <span className={styles.metricLabel}>{t('recruiter.totalApplications', 'Applications Submitted')}</span>
                  </div>
                </div>
              </div>

              {/* Recent Platform Records */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {/* Recently Registered Users */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <span>👥</span> Recently Registered Users
                    </h3>
                  </div>
                  {summary?.recentlyRegisteredUsers?.length > 0 ? (
                    <div className={styles.tableContainer}>
                      <table className={styles.adminTable}>
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.recentlyRegisteredUsers.map((u) => (
                            <tr key={u._id}>
                              <td>
                                <strong style={{ color: '#17365D' }}>{u.name}</strong>
                                <div style={{ fontSize: '0.78rem', color: '#526B85' }}>{u.email}</div>
                              </td>
                              <td>
                                <span className={styles.badge} style={{ background: '#F1F5F9', color: '#17365D', border: '1px solid #E1EDF3' }}>
                                  {u.role}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`${styles.badge} ${
                                    u.accountStatus === 'active' ? styles.badgeActive : styles.badgeSuspended
                                  }`}
                                >
                                  {u.accountStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#526B85', fontSize: '0.88rem' }}>No recently registered users found.</p>
                  )}
                </div>

                {/* Recently Created Jobs */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <span>💼</span> Recent Job Openings
                    </h3>
                  </div>
                  {summary?.recentJobs?.length > 0 ? (
                    <div className={styles.tableContainer}>
                      <table className={styles.adminTable}>
                        <thead>
                          <tr>
                            <th>Job Title</th>
                            <th>Town</th>
                            <th>Moderation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.recentJobs.map((j) => (
                            <tr key={j._id}>
                              <td>
                                <strong style={{ color: '#17365D' }}>{j.title}</strong>
                                <div style={{ fontSize: '0.78rem', color: '#526B85' }}>{j.company}</div>
                              </td>
                              <td>{j.town}</td>
                              <td>
                                <span
                                  className={`${styles.badge} ${
                                    j.moderationStatus === 'approved'
                                      ? styles.badgeApproved
                                      : j.moderationStatus === 'flagged'
                                      ? styles.badgeFlagged
                                      : styles.badgePending
                                  }`}
                                >
                                  {j.moderationStatus || 'approved'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#526B85', fontSize: '0.88rem' }}>No job listings created recently.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: User Management */}
      {activeTab === 'users' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>👥</span> User Governance & Account Oversight
            </h2>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
              <input
                type="text"
                id="search-users-input"
                className={styles.searchInput}
                placeholder="Search name, email, company..."
                value={userFilters.search}
                onChange={(e) => setUserFilters((prev) => ({ ...prev, search: e.target.value }))}
              />

              <select
                id="filter-role-select"
                className={styles.selectInput}
                value={userFilters.role}
                onChange={(e) => setUserFilters((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="">All Roles</option>
                <option value="jobseeker">Job Seekers</option>
                <option value="recruiter">Recruiters</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                id="filter-status-select"
                className={styles.selectInput}
                value={userFilters.accountStatus}
                onChange={(e) => setUserFilters((prev) => ({ ...prev, accountStatus: e.target.value }))}
              >
                <option value="">All Account Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending_verification">Pending Verification</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <p style={{ marginTop: '0.75rem' }}>Fetching user registry...</p>
            </div>
          ) : users.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🔍</div>
              <p>No users found matching current filters.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.adminTable} id="admin-users-table">
                <thead>
                  <tr>
                    <th>User / Contact</th>
                    <th>Role</th>
                    <th>Verification</th>
                    <th>Account Status</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isCurrentUser = String(u._id) === String(user?._id || user?.id);
                    return (
                      <tr key={u._id} id={`user-row-${u._id}`}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#17365D' }}>{u.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#526B85' }}>{u.email}</div>
                          {u.recruiterProfile?.companyName && (
                            <div style={{ fontSize: '0.75rem', color: '#0F766E' }}>
                              🏢 {u.recruiterProfile.companyName}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={styles.badge}
                            style={{
                              background:
                                u.role === 'admin'
                                  ? '#FEF3C7'
                                  : u.role === 'recruiter'
                                  ? '#F3EFFF'
                                  : '#E9F9F8',
                              color:
                                u.role === 'admin' ? '#B45309' : u.role === 'recruiter' ? '#6D28D9' : '#047857',
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.isVerified ? (
                            <span className={`${styles.badge} ${styles.badgeApproved}`}>✓ Verified</span>
                          ) : (
                            <span className={styles.badge} style={{ background: '#F1F5F9', color: '#526B85', border: '1px solid #E1EDF3' }}>
                              Unverified
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              u.accountStatus === 'active' ? styles.badgeActive : styles.badgeSuspended
                            }`}
                          >
                            {u.accountStatus}
                          </span>
                        </td>
                        <td>
                          {u.recruiterProfile?.town ||
                            u.jobseekerProfile?.location ||
                            'West Godavari'}
                        </td>
                        <td>
                          {isCurrentUser ? (
                            <span style={{ fontSize: '0.78rem', color: '#526B85', fontStyle: 'italic' }}>
                              Self (Protected)
                            </span>
                          ) : (
                            <button
                              type="button"
                              id={`btn-toggle-status-${u._id}`}
                              className={`${styles.btnSm} ${
                                u.accountStatus === 'active' ? styles.btnSuspend : styles.btnReactivate
                              }`}
                              onClick={() => handleToggleUserStatus(u)}
                            >
                              {u.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {userPagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={userPagination.page <= 1}
                onClick={() => fetchUsers(userPagination.page - 1)}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {userPagination.page} of {userPagination.totalPages} ({userPagination.total} users)
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={userPagination.page >= userPagination.totalPages}
                onClick={() => fetchUsers(userPagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Employer Verification Queue */}
      {activeTab === 'verifications' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>🏢</span> Employer Verification Review Queue
            </h2>

            <div className={styles.filterBar}>
              <select
                id="filter-verification-status"
                className={styles.selectInput}
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
              >
                <option value="pending">Awaiting Verification (Pending)</option>
                <option value="approved">Approved Employers</option>
                <option value="rejected">Rejected Requests</option>
                <option value="all">All Employers</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <p style={{ marginTop: '0.75rem' }}>Loading employer verification queue...</p>
            </div>
          ) : employers.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>✓</div>
              <p>No employers in this verification queue.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.adminTable} id="admin-employers-table">
                <thead>
                  <tr>
                    <th>Company / Recruiter</th>
                    <th>Mandal / Town</th>
                    <th>Industry</th>
                    <th>Current Status</th>
                    <th>Verification Details</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {employers.map((emp) => {
                    const comp = emp.recruiterProfile || {};
                    const req = emp.verificationRequest || {};
                    return (
                      <tr key={emp._id} id={`employer-row-${emp._id}`}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#17365D' }}>
                            {comp.companyName || emp.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#526B85' }}>{emp.email}</div>
                          {comp.phone && (
                            <div style={{ fontSize: '0.75rem', color: '#526B85' }}>📞 {comp.phone}</div>
                          )}
                          {comp.companyWebsite && (
                            <a
                              href={comp.companyWebsite}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '0.75rem', display: 'block', marginTop: 2, color: '#0F9D96' }}
                            >
                              🌐 {comp.companyWebsite}
                            </a>
                          )}
                        </td>
                        <td>{comp.town || 'West Godavari'}</td>
                        <td>{comp.industry || 'Local Business'}</td>
                        <td>
                          {emp.isVerified ? (
                            <span className={`${styles.badge} ${styles.badgeApproved}`}>✓ Approved</span>
                          ) : req.status === 'rejected' ? (
                            <span className={`${styles.badge} ${styles.badgeRejected}`}>✕ Rejected</span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgePending}`}>⏳ Pending Review</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', maxWidth: 220 }}>
                          {req.reason ? (
                            <span style={{ color: '#17365D' }}>"{req.reason}"</span>
                          ) : (
                            <span style={{ color: '#526B85' }}>No review note recorded</span>
                          )}
                          {req.reviewedAt && (
                            <div style={{ fontSize: '0.72rem', color: '#526B85', marginTop: 2 }}>
                              Reviewed: {new Date(req.reviewedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className={styles.btnGroup}>
                            <button
                              type="button"
                              id={`btn-approve-employer-${emp._id}`}
                              className={`${styles.btnSm} ${styles.btnApprove}`}
                              onClick={() => handleReviewVerification(emp, 'approved')}
                              disabled={emp.isVerified}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              id={`btn-reject-employer-${emp._id}`}
                              className={`${styles.btnSm} ${styles.btnReject}`}
                              onClick={() => handleReviewVerification(emp, 'rejected')}
                              disabled={req.status === 'rejected'}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {verificationPagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={verificationPagination.page <= 1}
                onClick={() => fetchVerifications(verificationPagination.page - 1)}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {verificationPagination.page} of {verificationPagination.totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={verificationPagination.page >= verificationPagination.totalPages}
                onClick={() => fetchVerifications(verificationPagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Job Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>🛡️</span> Job Moderation & Quality Enforcement
            </h2>

            <div className={styles.filterBar}>
              <input
                type="text"
                id="search-jobs-input"
                className={styles.searchInput}
                placeholder="Search job title, company, town..."
                value={jobFilters.search}
                onChange={(e) => setJobFilters((prev) => ({ ...prev, search: e.target.value }))}
              />

              <select
                id="filter-moderation-status"
                className={styles.selectInput}
                value={jobFilters.moderationStatus}
                onChange={(e) => setJobFilters((prev) => ({ ...prev, moderationStatus: e.target.value }))}
              >
                <option value="">All Moderation States</option>
                <option value="pending">Pending</option>
                <option value="flagged">Flagged</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                id="filter-job-status"
                className={styles.selectInput}
                value={jobFilters.status}
                onChange={(e) => setJobFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Publication States</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <p style={{ marginTop: '0.75rem' }}>Loading jobs for moderation...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>✓</div>
              <p>No job listings require moderation at this time.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.adminTable} id="admin-jobs-table">
                <thead>
                  <tr>
                    <th>Job Title & Company</th>
                    <th>Town</th>
                    <th>Category</th>
                    <th>Pub Status</th>
                    <th>Moderation</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j._id} id={`job-row-${j._id}`}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#17365D' }}>{j.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#0F766E' }}>{j.company}</div>
                        <div style={{ fontSize: '0.74rem', color: '#526B85' }}>
                          Posted: {new Date(j.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </td>
                      <td>{j.town}</td>
                      <td>
                        <span className={styles.badge} style={{ background: '#F1F5F9', color: '#17365D', border: '1px solid #E1EDF3' }}>
                          {j.category}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            j.status === 'published' ? styles.badgeActive : styles.badgeSuspended
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            j.moderationStatus === 'approved'
                              ? styles.badgeApproved
                              : j.moderationStatus === 'flagged'
                              ? styles.badgeFlagged
                              : j.moderationStatus === 'rejected'
                              ? styles.badgeRejected
                              : styles.badgePending
                          }`}
                        >
                          {j.moderationStatus || 'approved'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: 160 }}>
                        {j.moderationNotes ? (
                          <span style={{ color: '#17365D' }}>"{j.moderationNotes}"</span>
                        ) : (
                          <span style={{ color: '#526B85' }}>None</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.btnGroup}>
                          <button
                            type="button"
                            id={`btn-approve-job-${j._id}`}
                            className={`${styles.btnSm} ${styles.btnApprove}`}
                            title="Approve Listing"
                            onClick={() => handleModerateJob(j, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            id={`btn-flag-job-${j._id}`}
                            className={`${styles.btnSm} ${styles.btnFlag}`}
                            title="Flag for Investigation"
                            onClick={() => handleModerateJob(j, 'flag')}
                          >
                            Flag
                          </button>
                          <button
                            type="button"
                            id={`btn-reject-job-${j._id}`}
                            className={`${styles.btnSm} ${styles.btnReject}`}
                            title="Reject & Close"
                            onClick={() => handleModerateJob(j, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {jobPagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={jobPagination.page <= 1}
                onClick={() => fetchJobs(jobPagination.page - 1)}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {jobPagination.page} of {jobPagination.totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={jobPagination.page >= jobPagination.totalPages}
                onClick={() => fetchJobs(jobPagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Audit Activity Log */}
      {activeTab === 'activity' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>📜</span> Platform Administrative Activity Log
            </h2>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <p style={{ marginTop: '0.75rem' }}>Loading activity logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📋</div>
              <p>No administrative activity records logged yet.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.adminTable} id="admin-audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Performed By</th>
                    <th>Details & Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ fontSize: '0.78rem', color: '#526B85' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            background:
                              log.action.includes('APPROVED') || log.action.includes('VERIFIED') || log.action.includes('REACTIVATED')
                                ? '#E9F9F8'
                                : log.action.includes('FLAGGED')
                                ? '#F3EFFF'
                                : '#FEE2E2',
                            color:
                              log.action.includes('APPROVED') || log.action.includes('VERIFIED') || log.action.includes('REACTIVATED')
                                ? '#047857'
                                : log.action.includes('FLAGGED')
                                ? '#7C3AED'
                                : '#DC2626',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#17365D' }}>{log.targetName || log.targetId}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#526B85' }}>{log.targetType}</div>
                      </td>
                      <td>
                        <div style={{ color: '#17365D' }}>{log.performedByName || 'Administrator'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#526B85' }}>{log.performedByEmail}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#17365D' }}>
                        {log.details ? (
                          <div>
                            {log.details.reason && <div>Reason: "{log.details.reason}"</div>}
                            {log.details.notes && <div>Notes: "{log.details.notes}"</div>}
                            {log.details.newStatus && <div>New Status: {log.details.newStatus}</div>}
                          </div>
                        ) : (
                          <span style={{ color: '#526B85' }}>None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {auditPagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={auditPagination.page <= 1}
                onClick={() => fetchAuditLogs(auditPagination.page - 1)}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {auditPagination.page} of {auditPagination.totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={auditPagination.page >= auditPagination.totalPages}
                onClick={() => fetchAuditLogs(auditPagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation & Decision Modal Dialog */}
      {modalConfig && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle} id="modal-title">{modalConfig.title}</h3>
            <p style={{ fontSize: '0.88rem', color: '#526B85', lineHeight: 1.5 }}>
              {modalConfig.message}
            </p>

            {modalConfig.requireReason && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#17365D', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Administrative Reason / Justification:
                </label>
                <textarea
                  id="modal-reason-input"
                  className={styles.modalTextarea}
                  placeholder={modalConfig.reasonPlaceholder}
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                />
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={closeModal}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                id="modal-confirm-button"
                className={styles.modalConfirmBtn}
                onClick={handleModalSubmit}
                disabled={actionLoading || (modalConfig.requireReason && !modalReason.trim())}
              >
                {actionLoading ? 'Processing...' : modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
