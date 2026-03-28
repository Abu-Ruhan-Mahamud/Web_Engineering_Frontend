import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { getResults } from '../../services/api';
import '../../styles/doctor-dashboard.css';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const fetchDashboardData = async () => {
      try {
        setError('');
        const [statsRes, patientsRes, aptRes] = await Promise.all([
          api.get('/auth/doctor/dashboard-stats/', { signal: controller.signal }),
          api.get('/auth/doctor/patients/', { signal: controller.signal }),
          api.get('/appointments/', { signal: controller.signal }),
        ]);
        setStats(statsRes.data);
        setPatients(patientsRes.data);
        setAppointments(getResults(aptRes.data));
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

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter((a) => a.appointment_date === todayStr);

  const filteredAppointments =
    activeTab === 'all'
      ? todaysAppointments
      : todaysAppointments.filter((a) => a.status === activeTab);

  const statusCounts = {
    all: todaysAppointments.length,
    scheduled: todaysAppointments.filter((a) => a.status === 'scheduled').length,
    in_progress: todaysAppointments.filter((a) => a.status === 'in_progress').length,
    completed: todaysAppointments.filter((a) => a.status === 'completed').length,
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="doc-loading">
        <div className="doc-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '64px', height: '64px', opacity: 0.4 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        <p style={{ color: '#d32f2f', fontWeight: 500, marginTop: '0.5rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="doc-dashboard">
      {/* Welcome */}
      <div className="doc-dashboard-welcome">
        <h1>Welcome, Dr. {user?.last_name || user?.first_name}</h1>
        <p>{todayFormatted}</p>
      </div>

      {/* Stats */}
      <div className="doc-stats-grid">
        <Link to="/doctor/schedule" className="doc-stat-card-link">
          <div className="doc-stat-card">
            <div className="doc-stat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
              </svg>
            </div>
            <div className="doc-stat-info">
              <h3>{stats?.todays_appointments ?? 0}</h3>
              <p>Today's Appointments</p>
            </div>
          </div>
        </Link>
        <Link to="/doctor/patients" className="doc-stat-card-link">
          <div className="doc-stat-card">
            <div className="doc-stat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <div className="doc-stat-info">
              <h3>{stats?.total_patients ?? 0}</h3>
              <p>Total Patients</p>
            </div>
          </div>
        </Link>
        <Link to="/doctor/pending-reports" className="doc-stat-card-link">
          <div className="doc-stat-card">
            <div className="doc-stat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-3 4h4v2h-4v-2zm0 4h4v2h-4v-2zm-2-4h1v2H8v-2zm0 4h1v2H8v-2z" />
              </svg>
            </div>
            <div className="doc-stat-info">
              <h3>{stats?.pending_reports ?? 0}</h3>
              <p>Pending Reports</p>
            </div>
          </div>
        </Link>
        <Link to="/doctor/schedule" className="doc-stat-card-link">
          <div className="doc-stat-card">
            <div className="doc-stat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
              </svg>
            </div>
            <div className="doc-stat-info">
              <h3>{stats?.weekly_appointments ?? 0}</h3>
              <p>This Week</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="doc-dashboard-grid">
        {/* Today's Schedule */}
        <div className="doc-card">
          <div className="doc-card-header">
            <h2>Today's Schedule</h2>
            <Link to="/doctor/schedule" className="doc-card-link">
              View Full Schedule →
            </Link>
          </div>
          <div className="doc-schedule-tabs">
            {['all', 'scheduled', 'in_progress', 'completed'].map((tab) => (
              <button
                key={tab}
                className={`doc-schedule-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'in_progress'
                  ? 'In Progress'
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}{' '}
                ({statusCounts[tab]})
              </button>
            ))}
          </div>
          <div className="doc-appointment-list">
            {filteredAppointments.length === 0 ? (
              <div className="doc-empty-state">
                No appointments {activeTab !== 'all' ? `with status "${activeTab}"` : 'scheduled for today'}
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div key={apt.id} className="doc-appointment-item">
                  <div className="doc-time-box">
                    <div className="time">{formatTime(apt.appointment_time)}</div>
                    <div className="duration">
                      <svg viewBox="0 0 24 24">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                      </svg>
                      30 min
                    </div>
                  </div>
                  <div className="doc-apt-info">
                    <div className="doc-apt-name">{apt.patient_name || 'Patient'}</div>
                    <div className="doc-apt-type">{apt.reason || 'Consultation'}</div>
                  </div>
                  <span className={`doc-status-badge ${apt.status.replace('_', '-')}`}>
                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1).replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="doc-sidebar">
          {/* Quick Stats */}
          <div className="doc-card">
            <div className="doc-card-header">
              <h2>Quick Stats</h2>
            </div>
            <div className="doc-quick-stats">
              <div className="doc-quick-stat">
                <div className="value">
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todayApts = appointments.filter(a => a.appointment_date === today);
                    return todayApts.length - todayApts.filter(a => a.status === 'completed').length;
                  })()}
                </div>
                <div className="label">Remaining Today</div>
              </div>
              <div className="doc-quick-stat">
                <div className="value">{appointments.length}</div>
                <div className="label">Total Appts</div>
              </div>
              <div className="doc-quick-stat">
                <div className="value">{patients.length}</div>
                <div className="label">Total Patients</div>
              </div>
              <div className="doc-quick-stat">
                <div className="value">
                  {patients.filter((p) => {
                    if (!p.last_visit) return false;
                    const lv = new Date(p.last_visit);
                    const week = new Date();
                    week.setDate(week.getDate() - 7);
                    return lv >= week;
                  }).length}
                </div>
                <div className="label">New This Week</div>
              </div>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="doc-card">
            <div className="doc-card-header">
              <h2>Recent Patients</h2>
              <Link to="/doctor/patients" className="doc-card-link">
                View All →
              </Link>
            </div>
            <div className="doc-patient-list">
              {patients.length === 0 ? (
                <div className="doc-empty-state">No patients yet</div>
              ) : (
                patients.slice(0, 5).map((pt) => (
                  <div key={pt.id} className="doc-patient-item">
                    <div className="doc-patient-avatar">{getInitials(`${pt.first_name} ${pt.last_name}`)}</div>
                    <div className="doc-patient-info">
                      <div className="doc-patient-name">{pt.first_name} {pt.last_name}</div>
                      <div className="doc-patient-sub">
                        Last visit: {pt.last_visit || 'N/A'}
                      </div>
                    </div>
                    <Link to={`/doctor/patients/${pt.id}`} className="doc-view-btn">
                      View
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
