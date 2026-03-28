import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { getResults } from '../../services/api';
import '../../styles/notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page };
      if (filter === 'unread') params.is_read = 'false';
      if (filter === 'read') params.is_read = 'true';

      const res = await api.get('/notifications/', { params });
      setNotifications(getResults(res.data));
      setTotalCount(res.data.count || 0);
      setHasNext(!!res.data.next);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silently fail
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silently fail
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}/delete/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalCount((c) => c - 1);
    } catch {
      // silently fail
    }
  };

  // Handle notification click - navigate to related resource
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await api.patch(`/notifications/${notification.id}/read/`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      } catch {
        // silently fail
      }
    }

    // Navigate to list pages (individual detail pages don't exist yet)
    // System notifications have no related resource
    if (!notification.related_object_type) {
      return;
    }

    // Route based on user type
    if (user?.user_type === 'doctor') {
      // Doctor notifications
      const doctorNavigationMap = {
        lab_test: () => navigate('/doctor/pending-reports'),
        appointment: () => navigate('/doctor/schedule'),
      };
      const navigator = doctorNavigationMap[notification.related_object_type];
      if (navigator) {
        navigator();
      }
    } else {
      // Patient notifications
      const patientNavigationMap = {
        lab_test: () => navigate('/patient/lab-results'),
        appointment: () => navigate('/patient/appointments'),
        medication_reminder: () => navigate('/patient/medications'),
        medical_record: () => navigate('/patient/medical-records'),
        prescription: () => navigate('/patient/medical-records'),
      };
      const navigator = patientNavigationMap[notification.related_object_type];
      if (navigator) {
        navigator();
      }
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Delete all notifications? This cannot be undone.')) return;
    try {
      await api.delete('/notifications/clear/');
      setNotifications([]);
      setTotalCount(0);
    } catch {
      // silently fail
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'appointment':
        return (
          <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" /></svg>
        );
      case 'medication':
        return (
          <svg viewBox="0 0 24 24"><path d="M4.22 11.29l5.07-5.07a6.01 6.01 0 018.48 8.48l-5.07 5.07a6.01 6.01 0 01-8.48-8.48zm7.78 1.41L14.69 10l-1.41-1.41L10.59 11.3l-1.42-1.42 2.69-2.69a4 4 0 00-5.66 5.66l2.69-2.69 1.41 1.42L6.61 14.3a4 4 0 005.66-5.66l-2.69 2.69 1.42 1.41z" /></svg>
        );
      case 'lab_result':
        return (
          <svg viewBox="0 0 24 24"><path d="M7 2v2h1v7.15c-1.16.42-2 1.52-2 2.82V20c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-6.03c0-1.3-.84-2.4-2-2.82V4h1V2H7zm6 2v7h-2V4h2zm3 10.97V20H8v-5.03c0-.55.45-1 1-1h6c.55 0 1 .45 1 1z" /></svg>
        );
      case 'prescription':
        return (
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" /></svg>
        );
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'appointment': return '#1e3a8a';
      case 'medication': return '#059669';
      case 'lab_result': return '#7c3aed';
      case 'prescription': return '#ea580c';
      default: return '#64748b';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'appointment': return 'Appointment';
      case 'medication': return 'Medication';
      case 'lab_result': return 'Lab Result';
      case 'prescription': return 'Prescription';
      default: return 'System';
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notif-page">
      <div className="notif-page-header">
        <div className="notif-page-title-row">
          <h1>Notifications</h1>
          {totalCount > 0 && (
            <span className="notif-page-count">{totalCount} total</span>
          )}
        </div>
        <div className="notif-page-actions">
          {unreadCount > 0 && (
            <button className="notif-page-btn" onClick={markAllRead}>
              <svg viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" /></svg>
              Mark All Read
            </button>
          )}
          {totalCount > 0 && (
            <button className="notif-page-btn notif-page-btn-danger" onClick={clearAll}>
              <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="notif-page-filters">
        {['all', 'unread', 'read'].map((f) => (
          <button
            key={f}
            className={`notif-filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="notif-page-loading">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="notif-page-empty">
          <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" /></svg>
          <p>{filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}</p>
        </div>
      ) : (
        <div className="notif-page-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notif-page-item ${!notif.is_read ? 'unread' : ''}`}
              style={{ cursor: notif.related_object_id ? 'pointer' : 'default' }}
              role="button"
              tabIndex={0}
              onClick={() => handleNotificationClick(notif)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNotificationClick(notif);
                }
              }}
            >
              <div
                className="notif-page-item-icon"
                style={{ background: `${getTypeColor(notif.notification_type)}15`, color: getTypeColor(notif.notification_type) }}
              >
                {getTypeIcon(notif.notification_type)}
              </div>
              <div className="notif-page-item-body">
                <div className="notif-page-item-top">
                  <span
                    className="notif-page-item-type"
                    style={{ color: getTypeColor(notif.notification_type) }}
                  >
                    {getTypeLabel(notif.notification_type)}
                  </span>
                  <span className="notif-page-item-time">{notif.time_ago}</span>
                </div>
                <h3 className="notif-page-item-title">{notif.title}</h3>
                <p className="notif-page-item-message">{notif.message}</p>
              </div>
              <div className="notif-page-item-actions" onClick={(e) => e.stopPropagation()}>
                {!notif.is_read && (
                  <button
                    className="notif-item-action-btn"
                    title="Mark as read"
                    onClick={() => markAsRead(notif.id)}
                  >
                    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                  </button>
                )}
                <button
                  className="notif-item-action-btn notif-item-delete"
                  title="Delete"
                  onClick={() => deleteNotification(notif.id)}
                >
                  <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalCount > 20 && (
        <div className="notif-page-pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
