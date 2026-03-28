import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { getResults } from '../../services/api';
import '../../styles/profile.css';
import '../../styles/lab-profile.css';

const TABS = ['Personal Info', 'Work Overview', 'Security'];

export default function LabProfile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Personal form
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });

  // Work stats
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    totalHandled: 0,
    recentOrders: [],
  });

  // Password form
  const [pw, setPw] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [meRes, orderedRes, processingRes, sampleRes] = await Promise.all([
        api.get('/auth/me/'),
        api.get('/lab-tests/?status=ordered'),
        api.get('/lab-tests/?status=processing'),
        api.get('/lab-tests/?status=sample_collected'),
      ]);

      const me = meRes.data;
      setForm({
        first_name: me.first_name || '',
        last_name: me.last_name || '',
        phone: me.phone || '',
        email: me.email || '',
      });

      const ordered = getResults(orderedRes.data);
      const processing = getResults(processingRes.data);
      const sampleCollected = getResults(sampleRes.data);

      // Also fetch completed tests (results_available + reviewed)
      let completedCount = 0;
      try {
        const [raRes, revRes] = await Promise.all([
          api.get('/lab-tests/?status=results_available'),
          api.get('/lab-tests/?status=reviewed'),
        ]);
        completedCount = getResults(raRes.data).length + getResults(revRes.data).length;
      } catch {
        // ignore
      }

      const pendingCount = ordered.length + sampleCollected.length;
      const processingCount = processing.length;

      // Combine all for recent orders (take newest 5)
      const allOrders = [...ordered, ...sampleCollected, ...processing]
        .sort((a, b) => new Date(b.ordered_at) - new Date(a.ordered_at))
        .slice(0, 5);

      setStats({
        pending: pendingCount,
        processing: processingCount,
        completed: completedCount,
        totalHandled: pendingCount + processingCount + completedCount,
        recentOrders: allOrders,
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setSuccess('');
    setTimeout(() => setError(''), 5000);
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/me/', { phone: form.phone });
      updateUser({ ...user, phone: form.phone });
      showSuccess('Contact info updated!');
    } catch {
      showError('Failed to update contact info.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm_password) {
      showError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password/', pw);
      showSuccess('Password changed successfully!');
      setPw({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.current_password?.[0] ||
        err.response?.data?.new_password?.[0] ||
        'Failed to change password.';
      showError(detail);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPriorityClass = (p) => {
    if (p === 'stat') return 'lab-priority-stat';
    if (p === 'urgent') return 'lab-priority-urgent';
    return 'lab-priority-routine';
  };

  const getStatusLabel = (s) => {
    const map = {
      ordered: 'Ordered',
      sample_collected: 'Sample Collected',
      processing: 'Processing',
      results_available: 'Results Available',
      reviewed: 'Reviewed',
    };
    return map[s] || s;
  };

  if (loading) {
    return (
      <div className="doc-loading">
        <div className="doc-spinner" />
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header-card lab-profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-placeholder">{initials}</div>
          </div>
          <div className="profile-header-info">
            <h1>{form.first_name} {form.last_name}</h1>
            <p className="profile-email">{form.email}</p>
            <p className="profile-role">
              <span className="lab-role-badge">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: '0.35rem', verticalAlign: '-0.15em' }}>
                  <path d="M7 2v2h1v6.17A3.001 3.001 0 0 0 7 13v6a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-6a3.001 3.001 0 0 0-1-2.83V4h1V2H7zm4 4h2v5h-2V6zm3 7v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1z" />
                </svg>
                Lab Technician
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`profile-tab ${activeTab === i ? 'active' : ''}`}
            onClick={() => { setActiveTab(i); setSuccess(''); setError(''); }}
          >
            {tab}
          </button>
        ))}
      </div>

      {success && <div className="profile-success">{success}</div>}
      {error && <div className="lab-profile-error">{error}</div>}

      {/* ── Personal Info Tab ── */}
      {activeTab === 0 && (
        <form className="profile-section" onSubmit={handleSavePersonal}>
          <h2 className="profile-section-title">Personal Information</h2>
          <p className="profile-admin-notice">
            <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', verticalAlign: '-0.125em', fill: 'currentColor', marginRight: '0.3rem' }} aria-hidden="true">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            Name and email are managed by administration. Contact HR to request changes.
          </p>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label className="profile-label">First Name</label>
              <input type="text" className="profile-input" value={form.first_name} disabled />
            </div>
            <div className="profile-field">
              <label className="profile-label">Last Name</label>
              <input type="text" className="profile-input" value={form.last_name} disabled />
            </div>
            <div className="profile-field">
              <label className="profile-label">Email</label>
              <input type="email" className="profile-input" value={form.email} disabled />
            </div>
            <div className="profile-field">
              <label className="profile-label">Phone</label>
              <input
                type="text"
                className="profile-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="profile-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── Work Overview Tab ── */}
      {activeTab === 1 && (
        <>
          {/* Stats Cards */}
          <div className="profile-section">
            <h2 className="profile-section-title">Lab Work Summary</h2>
            <div className="lab-stats-grid">
              <div className="lab-stat-card lab-stat-pending">
                <div className="lab-stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                </div>
                <div className="lab-stat-number">{stats.pending}</div>
                <div className="lab-stat-label">Pending</div>
              </div>
              <div className="lab-stat-card lab-stat-processing">
                <div className="lab-stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                  </svg>
                </div>
                <div className="lab-stat-number">{stats.processing}</div>
                <div className="lab-stat-label">Processing</div>
              </div>
              <div className="lab-stat-card lab-stat-completed">
                <div className="lab-stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
                <div className="lab-stat-number">{stats.completed}</div>
                <div className="lab-stat-label">Completed</div>
              </div>
              <div className="lab-stat-card lab-stat-total">
                <div className="lab-stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
                <div className="lab-stat-number">{stats.totalHandled}</div>
                <div className="lab-stat-label">Total Orders</div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="profile-section">
            <h2 className="profile-section-title">Recent Queue</h2>
            {stats.recentOrders.length === 0 ? (
              <div className="lab-empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="#d1d5db">
                  <path d="M7 2v2h1v6.17A3.001 3.001 0 0 0 7 13v6a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-6a3.001 3.001 0 0 0-1-2.83V4h1V2H7z" />
                </svg>
                <p>No pending lab orders at the moment.</p>
              </div>
            ) : (
              <div className="lab-recent-list">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="lab-recent-item">
                    <div className="lab-recent-info">
                      <div className="lab-recent-test">{order.test_name}</div>
                      <div className="lab-recent-patient">
                        {order.patient_name || 'Patient'} · {formatDate(order.ordered_at)}
                      </div>
                    </div>
                    <div className="lab-recent-badges">
                      <span className={`lab-priority-badge ${getPriorityClass(order.priority)}`}>
                        {order.priority?.toUpperCase()}
                      </span>
                      <span className={`lab-status-badge lab-status-${order.status}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Security Tab ── */}
      {activeTab === 2 && (
        <form className="profile-section" onSubmit={handleChangePassword}>
          <h2 className="profile-section-title">Change Password</h2>

          <div className="profile-form-grid">
            <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
              <label className="profile-label">Current Password</label>
              <input
                type="password"
                className="profile-input"
                value={pw.current_password}
                onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
                required
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">New Password</label>
              <input
                type="password"
                className="profile-input"
                value={pw.new_password}
                onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Confirm New Password</label>
              <input
                type="password"
                className="profile-input"
                value={pw.confirm_password}
                onChange={(e) => setPw({ ...pw, confirm_password: e.target.value })}
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="lab-password-requirements">
            <p className="lab-req-title">Password must:</p>
            <ul>
              <li className={pw.new_password.length >= 8 ? 'met' : ''}>Be at least 8 characters</li>
              <li className={/[A-Z]/.test(pw.new_password) ? 'met' : ''}>Include an uppercase letter</li>
              <li className={/[0-9]/.test(pw.new_password) ? 'met' : ''}>Include a number</li>
              <li className={/[^A-Za-z0-9]/.test(pw.new_password) ? 'met' : ''}>Include a special character</li>
            </ul>
          </div>

          <div className="profile-form-actions">
            <button
              type="button"
              className="lab-btn-secondary"
              onClick={() => setPw({ current_password: '', new_password: '', confirm_password: '' })}
            >
              Cancel
            </button>
            <button type="submit" className="profile-btn-primary" disabled={saving}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
