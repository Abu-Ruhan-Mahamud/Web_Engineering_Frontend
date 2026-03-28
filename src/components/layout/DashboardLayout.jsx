import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { getResults } from '../../services/api';
import useToast from '../../hooks/useToast';
import ToastContainer from '../common/ToastContainer';
import '../../styles/dashboard.css';
import '../../styles/notifications.css';

/**
 * Dashboard layout shared by patient / doctor / admin.
 * Renders a top header (logo + nav + user menu) and an <Outlet /> for child routes.
 *
 * Props:
 *   navItems — array of { label, to } for the nav links
 */
export default function DashboardLayout({ navItems = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const prevUnreadRef = useRef(null);   // null = first poll hasn't happened yet
  const menuRef = useRef(null);
  const mobileNavRef = useRef(null);
  const notifRef = useRef(null);
  const { toasts, addToast, removeToast } = useToast(8000);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target)) {
        setMobileNavOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fire in-app toast popups + optional browser notification when new unreads appear
  const fireDesktopNotification = useCallback(async (newCount) => {
    // Fetch the newest unread notifications that just appeared
    const howMany = Math.min(newCount - prevUnreadRef.current, 5); // cap at 5 toasts
    try {
      const res = await api.get('/notifications/', {
        params: { is_read: 'false', page_size: howMany },
      });
      const items = getResults(res.data);

      // Show an in-app toast for each new notification
      items.forEach((n) => {
        addToast({ title: n.title, message: n.message, type: n.notification_type });
      });

      // Also fire a browser desktop notification for the most recent one
      if (
        'Notification' in window &&
        Notification.permission === 'granted' &&
        items.length > 0
      ) {
        const n = items[0];
        const notif = new window.Notification(n.title, {
          body: n.message,
          icon: '/curova-icon.png',
          tag: `curova-${n.id}`,
        });
        setTimeout(() => notif.close(), 6000);
      }
    } catch {
      // silent
    }
  }, [addToast]);

  // Poll unread count every 30 seconds
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count/');
      const newCount = res.data.unread_count;
      setUnreadCount(newCount);

      // On the very first poll (login / page load) just record the baseline —
      // don't fire toasts for notifications that already existed.
      if (prevUnreadRef.current === null) {
        prevUnreadRef.current = newCount;
        return;
      }

      // Fire toasts only when NEW notifications arrive after the baseline
      if (newCount > prevUnreadRef.current) {
        fireDesktopNotification(newCount);
      }
      prevUnreadRef.current = newCount;
    } catch {
      // silently fail
    }
  }, [fireDesktopNotification]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (!notifOpen) return;
    const fetchRecent = async () => {
      try {
        const res = await api.get('/notifications/', { params: { page_size: 6 } });
        setRecentNotifs(getResults(res.data));
      } catch {
        // silently fail
      }
    };
    fetchRecent();
  }, [notifOpen]);

  const handleMarkOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read/`);
      setRecentNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  // Handle notification click - mark as read and navigate to related resource
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      try {
        await api.patch(`/notifications/${notification.id}/read/`);
        setRecentNotifs((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silently fail
      }
    }

    // Close dropdown
    setNotifOpen(false);

    // Navigate to list pages (individual detail pages don't exist yet)
    // System notifications have no related resource
    if (!notification.related_object_type) {
      return;
    }

    const navigationMap = {
      lab_test: () => navigate(`/patient/lab-results`),
      appointment: () => navigate(`/patient/appointments`),
      medication_reminder: () => navigate(`/patient/medications`),
      medical_record: () => navigate(`/patient/medical-records`),
      prescription: () => navigate(`/patient/medical-records`),
    };

    const navigator = navigationMap[notification.related_object_type];
    if (navigator) {
      navigator();
    }
  };

  const getNotifDotColor = (type) => {
    switch (type) {
      case 'appointment': return '#1e3a8a';
      case 'medication': return '#059669';
      case 'lab_result': return '#7c3aed';
      case 'prescription': return '#ea580c';
      default: return '#64748b';
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  const profilePath = user?.user_type === 'patient'
    ? '/patient/profile'
    : user?.user_type === 'doctor'
      ? '/doctor/profile'
      : user?.user_type === 'lab_tech'
        ? '/lab/profile'
        : '/admin/profile';

  const notificationsPath = user?.user_type === 'lab_tech'
    ? '/lab/notifications'
    : `/${user?.user_type}/notifications`;

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-left">
          {/* Hamburger toggle for mobile/compact views */}
          <button
            className="dash-hamburger"
            aria-label="Toggle navigation"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <span className={`dash-hamburger-line ${mobileNavOpen ? 'open' : ''}`} />
            <span className={`dash-hamburger-line ${mobileNavOpen ? 'open' : ''}`} />
            <span className={`dash-hamburger-line ${mobileNavOpen ? 'open' : ''}`} />
          </button>

          <Link to="/" className="dash-logo">CUROVA</Link>
          <nav className="dash-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => isActive ? 'active' : ''}
                end={item.end}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="dash-header-right">
          {/* Notification bell with dropdown */}
          <div className="notif-dropdown-wrapper" ref={notifRef}>
            <button
              className="dash-notification-btn"
              aria-label="Notifications"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
              </svg>
              {unreadCount > 0 && (
                <span className="dash-notification-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button className="notif-dropdown-mark-all" onClick={handleMarkAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="notif-dropdown-list">
                  {recentNotifs.length === 0 ? (
                    <div className="notif-dropdown-empty">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                      </svg>
                      <p>No notifications</p>
                    </div>
                  ) : (
                    recentNotifs.map((n) => (
                      <button
                        key={n.id}
                        className={`notif-dropdown-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span
                          className="notif-dropdown-item-dot"
                          style={{ background: !n.is_read ? getNotifDotColor(n.notification_type) : 'transparent' }}
                        />
                        <div className="notif-dropdown-item-content">
                          <p className="notif-dropdown-item-title">{n.title}</p>
                          <p className="notif-dropdown-item-msg">{n.message}</p>
                          <span className="notif-dropdown-item-time">{n.time_ago}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="notif-dropdown-footer">
                  <Link to={notificationsPath} onClick={() => setNotifOpen(false)}>
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User avatar + dropdown */}
          <div className="dash-user-menu" ref={menuRef}>
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Avatar"
                className="dash-avatar"
                onClick={() => setMenuOpen(!menuOpen)}
              />
            ) : (
              <div
                className="dash-avatar-placeholder"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {initials}
              </div>
            )}

            {menuOpen && (
              <div className="dash-user-dropdown">
                <div className="dash-user-dropdown-info">
                  <div className="dash-user-dropdown-name">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="dash-user-dropdown-email">{user?.email}</div>
                </div>
                <Link to={profilePath} onClick={() => setMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  Profile
                </Link>
                <button className="logout-btn" onClick={handleLogout}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile navigation overlay */}
      {mobileNavOpen && (
        <div className="dash-mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />
      )}
      <nav
        className={`dash-mobile-nav ${mobileNavOpen ? 'open' : ''}`}
        ref={mobileNavRef}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => isActive ? 'active' : ''}
            end={item.end}
            onClick={() => setMobileNavOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="dash-main">
        <Outlet />
      </main>

      {/* In-app toast popups for medication reminders & other notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
