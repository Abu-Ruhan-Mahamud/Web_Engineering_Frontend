import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getResults } from '../../services/api';
import '../../styles/admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, apptsRes] = await Promise.all([
          api.get('/admin/stats/', { signal: controller.signal }),
          api.get('/admin/users/', { signal: controller.signal }),
          api.get('/admin/appointments/', { signal: controller.signal }),
        ]);
        setStats(statsRes.data);
        setRecentUsers(getResults(usersRes.data).slice(0, 5));
        setRecentAppointments(getResults(apptsRes.data).slice(0, 8));
      } catch {
        if (controller.signal.aborted) return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  const statusColor = (s) => {
    const map = {
      scheduled: '#3b82f6',
      confirmed: '#10b981',
      in_progress: '#f59e0b',
      completed: '#0ea5e9',
      cancelled: '#ef4444',
      no_show: '#ec4899',
      rescheduled: '#8b5cf6',
    };
    return map[s] || '#6b7280';
  };

  const iconStyle = { width: '1em', height: '1em', verticalAlign: '-0.125em', fill: 'currentColor' };
  const userTypeIcon = (t) => {
    if (t === 'doctor') return (
      <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true">
        <path d="M10.5 15H8v-3h2.5V9.5h3V12H16v3h-2.5v2.5h-3V15zM19 8c0-3.87-3.13-7-7-7S5 4.13 5 8c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-3.26c1.81-1.27 3-3.36 3-5.74zm-7 12c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z"/>
      </svg>
    );
    if (t === 'admin') return (
      <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
      </svg>
    );
    return (
      <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    );
  };

  const statusLabel = (s) => s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Dashboard</h1>
          <p className="admin-page-subtitle">System overview and management</p>
        </div>
      </div>

      {/* ─── Stats Cards ───────────────────────── */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card admin-stat-primary">
          <div className="admin-stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats?.total_users ?? 0}</div>
            <div className="admin-stat-label">Total Users</div>
          </div>
          <div className="admin-stat-breakdown">
            <span>{stats?.users_by_type?.patient ?? 0} patients</span>
            <span>{stats?.users_by_type?.doctor ?? 0} doctors</span>
            <span>{stats?.users_by_type?.admin ?? 0} admins</span>
          </div>
        </div>

        <div className="admin-stat-card admin-stat-blue">
          <div className="admin-stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-7-5h5v5h-5z"/></svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats?.total_appointments ?? 0}</div>
            <div className="admin-stat-label">Total Appointments</div>
          </div>
          <div className="admin-stat-breakdown">
            <span>{stats?.appointments_by_status?.scheduled ?? 0} scheduled</span>
            <span>{stats?.appointments_by_status?.completed ?? 0} completed</span>
          </div>
        </div>

        <div className="admin-stat-card admin-stat-green">
          <div className="admin-stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats?.total_medical_records ?? 0}</div>
            <div className="admin-stat-label">Medical Records</div>
          </div>
        </div>

        <div className="admin-stat-card admin-stat-teal">
          <div className="admin-stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v2H6V3zm0 16h12v2H6v-2zm10-8H8v2h8v-2zm-4-4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{stats?.active_medications ?? 0}</div>
            <div className="admin-stat-label">Active Medications</div>
          </div>
        </div>
      </div>

      {/* ─── Activity Badges ───────────────────── */}
      <div className="admin-activity-badges">
        <div className="admin-badge">
          <span className="admin-badge-value">{stats?.recent_users_30d ?? 0}</span>
          <span className="admin-badge-label">New users (30d)</span>
        </div>
        <div className="admin-badge">
          <span className="admin-badge-value">{stats?.recent_appointments_30d ?? 0}</span>
          <span className="admin-badge-label">Appointments (30d)</span>
        </div>
      </div>

      {/* ─── Two-Column Content ─────────────────── */}
      <div className="admin-content-grid">
        {/* Appointment Status Distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Appointment Status</h2>
            <Link to="/admin/appointments" className="admin-card-link">View All →</Link>
          </div>
          <div className="admin-status-bars">
            {stats && Object.entries(stats.appointments_by_status).map(([key, val]) => (
              <div key={key} className="admin-status-row">
                <span className="admin-status-label">{statusLabel(key)}</span>
                <div className="admin-status-bar-track">
                  <div
                    className="admin-status-bar-fill"
                    style={{
                      width: `${stats.total_appointments ? (val / stats.total_appointments) * 100 : 0}%`,
                      backgroundColor: statusColor(key),
                    }}
                  />
                </div>
                <span className="admin-status-count">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Recent Users</h2>
            <Link to="/admin/users" className="admin-card-link">Manage →</Link>
          </div>
          <div className="admin-user-list-mini">
            {recentUsers.map((u) => (
              <div key={u.id} className="admin-user-row-mini">
                <span className="admin-user-type-icon">{userTypeIcon(u.user_type)}</span>
                <div className="admin-user-info-mini">
                  <span className="admin-user-name-mini">{u.full_name}</span>
                  <span className="admin-user-email-mini">{u.email}</span>
                </div>
                <span className={`admin-user-type-badge admin-badge-${u.user_type}`}>
                  {u.user_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Recent Appointments Table ──────────── */}
      <div className="admin-card admin-full-width">
        <div className="admin-card-header">
          <h2>Recent Appointments</h2>
          <Link to="/admin/appointments" className="admin-card-link">View All →</Link>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.patient_name}</td>
                  <td>{a.doctor_name}</td>
                  <td>{a.appointment_date}</td>
                  <td>{a.appointment_time?.slice(0, 5)}</td>
                  <td>
                    <span
                      className="admin-status-chip"
                      style={{ backgroundColor: statusColor(a.status) + '20', color: statusColor(a.status) }}
                    >
                      {statusLabel(a.status)}
                    </span>
                  </td>
                  <td className="admin-td-truncate">{a.reason || '—'}</td>
                </tr>
              ))}
              {recentAppointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-empty-row">No appointments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
