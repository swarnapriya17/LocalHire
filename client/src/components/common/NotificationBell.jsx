import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './NotificationBell.module.css';

function getNotificationIcon(type) {
  switch (type) {
    case 'APPLICATION_SUBMITTED':
      return '📄';
    case 'APPLICATION_STATUS_UPDATED':
      return '📊';
    case 'INTERVIEW_SCHEDULED':
      return '📅';
    case 'EMPLOYER_VERIFIED':
      return '🛡️';
    case 'EMPLOYER_REJECTED':
      return '⚠️';
    case 'JOB_APPROVED':
      return '✅';
    case 'JOB_REJECTED':
      return '🛑';
    case 'JOB_FLAGGED':
      return '🚩';
    case 'SYSTEM_ALERT':
    default:
      return '🔔';
  }
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationBell() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);
  const [dbUnavailable, setDbUnavailable] = useState(false);
  const containerRef = useRef(null);

  // Poll unread count on mount and every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        if (isMounted && res?.success) {
          setUnreadCount(res.unreadCount || 0);
          setDbUnavailable(false);
        }
      } catch (err) {
        if (isMounted && (err?.status === 503 || err?.code === 'DATABASE_UNAVAILABLE')) {
          setDbUnavailable(true);
        }
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Load notification list when panel is opened
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    let isMounted = true;
    const loadList = async () => {
      setLoading(true);
      try {
        const res = await notificationService.getNotifications({ limit: 25 });
        if (isMounted && res?.success) {
          setNotifications(res.data || []);
          setUnreadCount(res.unreadCount || 0);
          setDbUnavailable(false);
        }
      } catch (err) {
        if (isMounted && (err?.status === 503 || err?.code === 'DATABASE_UNAVAILABLE')) {
          setDbUnavailable(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadList();
  }, [isOpen, isAuthenticated]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Could not mark notification as read:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Could not mark all notifications as read:', err.message);
    }
  };

  const handleItemClick = (notification) => {
    // If unread, mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification._id || notification.id);
    }

    setIsOpen(false);

    // Contextual routing based on entity type and user role
    if (notification.relatedEntityType === 'Application') {
      if (user?.role === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else if (notification.relatedEntityType === 'Job') {
      if (user?.role === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/#jobs');
      }
    } else if (notification.relatedEntityType === 'User') {
      if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user?.role === 'recruiter') {
        navigate('/recruiter/dashboard');
      }
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    return true;
  });

  if (!isAuthenticated) return null;

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={toggleOpen}
        title={t('notifications.title', 'Notifications')}
        aria-label={t('notifications.title', 'Notifications')}
        aria-expanded={isOpen}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {unreadCount > 0 && (
          <span className={styles.badge} aria-label={`${unreadCount} unread`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.panel} role="dialog" aria-label="Notifications Panel">
          <div className={styles.panelHeader}>
            <div className={styles.headerTitle}>
              <span>{t('notifications.title', 'Notifications')}</span>
              {unreadCount > 0 && (
                <span className={styles.unreadTag}>
                  {unreadCount} {t('notifications.unreadBadge', 'unread')}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAllBtn}
                onClick={handleMarkAllAsRead}
                disabled={dbUnavailable}
              >
                {t('notifications.markAllRead', 'Mark all as read')}
              </button>
            )}
          </div>

          {dbUnavailable && (
            <div className={styles.statusBanner}>
              <span>⚠️</span>
              <span>{t('notifications.databaseUnavailable', 'Live notifications require database connection.')}</span>
            </div>
          )}

          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('all')}
            >
              {t('notifications.allTab', 'All')} ({notifications.length})
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'unread' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              {t('notifications.unreadTab', 'Unread')} ({unreadCount})
            </button>
          </div>

          <div className={styles.list}>
            {loading ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyDesc}>{t('common.loading', 'Loading notifications...')}</div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔔</div>
                <div className={styles.emptyTitle}>
                  {t('notifications.emptyTitle', 'No notifications yet')}
                </div>
                <div className={styles.emptyDesc}>
                  {t('notifications.emptySubtitle', 'We will notify you when employers review your applications or post updates.')}
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const id = notif._id || notif.id;
                const isUnread = !notif.isRead;
                return (
                  <div
                    key={id}
                    className={`${styles.item} ${isUnread ? styles.unreadItem : ''}`}
                    onClick={() => handleItemClick(notif)}
                  >
                    {isUnread && <div className={styles.unreadDot} />}
                    <div className={styles.iconBox}>{getNotificationIcon(notif.type)}</div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{notif.title}</div>
                      <div className={styles.itemMsg}>{notif.message}</div>
                      <div className={styles.itemFooter}>
                        <span className={styles.itemTime}>
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                        {isUnread && (
                          <button
                            type="button"
                            className={styles.readActionBtn}
                            onClick={(e) => handleMarkAsRead(id, e)}
                          >
                            ✓ {t('common.read', 'Mark read')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
