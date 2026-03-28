import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { getResults } from '../../services/api';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const fetchDashboardData = async () => {
      try {
        setError('');
        const [statsRes, appointmentsRes, medsRes] = await Promise.all([
          api.get('/auth/dashboard-stats/', { signal: controller.signal }),
          api.get('/appointments/', { params: { upcoming: 'true' }, signal: controller.signal }),
          api.get('/medications/', { params: { active: 'true' }, signal: controller.signal }),
        ]);
        setStats(statsRes.data);
        setAppointments(getResults(appointmentsRes.data).slice(0, 3));

        // Map medications for display: show name, dosage, frequency
        const meds = (getResults(medsRes.data) || []).map((med) => ({
          name: med.name,
          time: med.frequency || '',
          schedule: med.dosage || '',
        }));
        setMedications(meds);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError('Failed to load dashboard. Please refresh the page.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => controller.abort();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }),
    };
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(h), parseInt(m));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const statusClass = (status) => {
    const map = {
      scheduled: 'dash-status-scheduled',
      confirmed: 'dash-status-confirmed',
      completed: 'dash-status-completed',
      cancelled: 'dash-status-cancelled',
      in_progress: 'dash-status-in-progress',
      no_show: 'dash-status-no-show',
      rescheduled: 'dash-status-rescheduled',
    };
    return map[status] || 'dash-status-scheduled';
  };

  const statusLabel = (status) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : '';

  if (loading) {
    return (
      <div className="dash-empty">
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-empty">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '64px', height: '64px', opacity: 0.4 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        <p style={{ color: '#d32f2f', fontWeight: 500, marginTop: '0.5rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="dash-welcome">
        <h1>
          Welcome back, <strong>{user?.first_name || 'Patient'}</strong>
        </h1>
        <p>Here's your health overview for today</p>
      </div>

      {/* Stats Grid */}
      <div className="dash-stats-grid">
        <Link to="/patient/appointments" className="dash-stat-card-link">
          <div className="dash-stat-card">
            <div className="dash-stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
              </svg>
            </div>
            <div>
              <div className="dash-stat-value">{stats?.total_appointments ?? 0}</div>
              <div className="dash-stat-label">Total Appointments</div>
            </div>
          </div>
        </Link>

        <Link to="/patient/medications" className="dash-stat-card-link">
          <div className="dash-stat-card">
            <div className="dash-stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M4.22 11.29l7.07-7.07c.78-.78 2.05-.78 2.83 0l1.41 1.41c.78.78.78 2.05 0 2.83l-7.07 7.07c-.78.78-2.05.78-2.83 0L4.22 14.12c-.78-.78-.78-2.05 0-2.83zm7.07 7.07l3.54-3.54c.78-.78 2.05-.78 2.83 0l1.41 1.41c.78.78.78 2.05 0 2.83l-3.54 3.54c-.78.78-2.05.78-2.83 0l-1.41-1.41c-.78-.78-.78-2.05 0-2.83z" />
              </svg>
            </div>
            <div>
              <div className="dash-stat-value">{stats?.active_medications ?? 0}</div>
              <div className="dash-stat-label">Active Medications</div>
            </div>
          </div>
        </Link>

        <Link to="/patient/medical-records" className="dash-stat-card-link">
          <div className="dash-stat-card">
            <div className="dash-stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            </div>
            <div>
              <div className="dash-stat-value">{stats?.medical_records ?? 0}</div>
              <div className="dash-stat-label">Medical Records</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Content Grid — 2fr 1fr */}
      <div className="dash-content-grid">
        {/* LEFT — Upcoming Appointments */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Upcoming Appointments</h2>
            <Link className="dash-card-link" to="/patient/appointments">
              View All →
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="dash-empty">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
              </svg>
              <p>No upcoming appointments</p>
            </div>
          ) : (
            appointments.map((apt) => {
              const { day, month } = formatDate(apt.appointment_date);
              return (
                <div key={apt.id} className="dash-appointment-item">
                  <div className="dash-appointment-date">
                    <div className="dash-appointment-day">{day}</div>
                    <div className="dash-appointment-month">{month}</div>
                  </div>
                  <div className="dash-appointment-info">
                    <div className="dash-appointment-doctor">{apt.doctor_name}</div>
                    <div className="dash-appointment-specialty">
                      {apt.doctor_specialization}
                    </div>
                    <div className="dash-appointment-time">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                      </svg>
                      {formatTime(apt.appointment_time)}
                      {apt.end_time ? ` – ${formatTime(apt.end_time)}` : ''}
                    </div>
                  </div>
                  <span className={`dash-status ${statusClass(apt.status)}`}>
                    {statusLabel(apt.status)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT — Quick Actions + Today's Medications */}
        <div>
          <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
            <div className="dash-card-header">
              <h2 className="dash-card-title">Quick Actions</h2>
            </div>
            <div className="dash-quick-actions">
              <Link to="/patient/appointments" className="dash-quick-action">
                <div className="dash-quick-action-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                  </svg>
                </div>
                <span>Book Appointment</span>
              </Link>
              <Link to="/patient/medical-records" className="dash-quick-action">
                <div className="dash-quick-action-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                </div>
                <span>View Records</span>
              </Link>
              <Link to="/patient/prescriptions" className="dash-quick-action">
                <div className="dash-quick-action-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14H9v-2h2v2zm0-4H9V7h2v6zm4 4h-2v-4h2v4zm0-6h-2V7h2v4z" />
                  </svg>
                </div>
                <span>Prescriptions</span>
              </Link>
              <Link to="/patient/documents" className="dash-quick-action">
                <div className="dash-quick-action-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                  </svg>
                </div>
                <span>Upload Document</span>
              </Link>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">Today's Medications</h2>
            </div>
            {medications.length === 0 ? (
              <div className="dash-empty">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M4.22 11.29l7.07-7.07c.78-.78 2.05-.78 2.83 0l1.41 1.41c.78.78.78 2.05 0 2.83l-7.07 7.07c-.78.78-2.05.78-2.83 0L4.22 14.12c-.78-.78-.78-2.05 0-2.83zm7.07 7.07l3.54-3.54c.78-.78 2.05-.78 2.83 0l1.41 1.41c.78.78.78 2.05 0 2.83l-3.54 3.54c-.78.78-2.05.78-2.83 0l-1.41-1.41c-.78-.78-.78-2.05 0-2.83z" />
                </svg>
                <p>No medications scheduled for today</p>
              </div>
            ) : (
              medications.map((med, idx) => (
                <div key={idx} className="dash-med-item">
                  <div className="dash-med-time">{med.time}</div>
                  <div>
                    <div className="dash-med-name">{med.name}</div>
                    <div className="dash-med-dose">{med.schedule}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
