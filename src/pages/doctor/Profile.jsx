import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import '../../styles/profile.css';
import '../../styles/doctor-schedule.css';

const TABS = ['Personal Info', 'Professional Info', 'Schedule'];
const SPECIALIZATIONS = [
  { value: 'general_practice', label: 'General Practice' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'ent', label: 'ENT' },
  { value: 'gynecology', label: 'Gynecology' },
  { value: 'urology', label: 'Urology' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'other', label: 'Other' },
];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DoctorProfile() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'schedule' ? 2 : 0;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [conflictModal, setConflictModal] = useState(null);

  // Personal form
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });

  // Professional form
  const [profile, setProfile] = useState({
    license_number: '',
    specialization: '',
    years_experience: 0,
    bio: '',
    consultation_fee: '0.00',
  });

  // Schedule form
  const [schedule, setSchedule] = useState({
    available_days: [],
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    slot_duration: 30,
  });

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/doctor/profile/');
      const data = res.data;
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        email: data.email || '',
      });
      setProfile({
        license_number: data.profile?.license_number || '',
        specialization: data.profile?.specialization || '',
        years_experience: data.profile?.years_experience || 0,
        bio: data.profile?.bio || '',
        consultation_fee: data.profile?.consultation_fee || '0.00',
      });
      const hrs_start = data.profile?.working_hours_start || '09:00:00';
      const hrs_end = data.profile?.working_hours_end || '17:00:00';
      setSchedule({
        available_days: data.profile?.available_days || [],
        working_hours_start: hrs_start.slice(0, 5),
        working_hours_end: hrs_end.slice(0, 5),
        slot_duration: data.profile?.slot_duration || 30,
      });
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      const res = await api.put('/auth/doctor/profile/', {
        phone: form.phone,
      });
      updateUser({ ...user, phone: res.data.phone });
      setSuccess('Contact info updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfessional = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      await api.put('/auth/doctor/profile/', {
        bio: profile.bio,
        consultation_fee: profile.consultation_fee,
      });
      setSuccess('Professional info updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const saveSchedulePayload = async (payload) => {
    setSaving(true);
    setSuccess('');
    try {
      const res = await api.put('/auth/doctor/schedule/', payload);
      const cancelled = res.data.cancelled_count || 0;
      setSuccess(
        cancelled > 0
          ? `Schedule updated — ${cancelled} conflicting appointment${cancelled > 1 ? 's' : ''} cancelled & patients notified.`
          : 'Schedule updated!'
      );
      setConflictModal(null);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.has_conflicts) {
        setConflictModal({
          conflicts: err.response.data.conflicts,
          message: err.response.data.message,
          pendingSchedule: payload,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    saveSchedulePayload({
      available_days: schedule.available_days,
      working_hours_start: schedule.working_hours_start,
      working_hours_end: schedule.working_hours_end,
      slot_duration: Number(schedule.slot_duration),
    });
  };

  const handleForceSchedule = () => {
    if (!conflictModal) return;
    saveSchedulePayload({ ...conflictModal.pendingSchedule, force: true });
  };

  const toggleDay = (day) => {
    setSchedule((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter((d) => d !== day)
        : [...prev.available_days, day],
    }));
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
      <div className="profile-header-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-placeholder">{initials}</div>
          </div>
          <div className="profile-header-info">
            <h1>Dr. {form.first_name} {form.last_name}</h1>
            <p className="profile-email">{form.email}</p>
            <p className="profile-role">
              {SPECIALIZATIONS.find((s) => s.value === profile.specialization)?.label || 'Doctor'}{' '}
              · {profile.years_experience} years experience
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
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      {success && <div className="profile-success">{success}</div>}

      {/* Personal Info Tab */}
      {activeTab === 0 && (
        <form className="profile-section" onSubmit={handleSavePersonal}>
          <h2 className="profile-section-title">Personal Information</h2>
          <p className="profile-admin-notice">
            <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', verticalAlign: '-0.125em', fill: 'currentColor', marginRight: '0.3rem' }} aria-hidden="true"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
            Name and email are managed by administration. Contact HR to request changes.
          </p>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label className="profile-label">First Name</label>
              <input
                type="text"
                className="profile-input"
                value={form.first_name}
                disabled
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Last Name</label>
              <input
                type="text"
                className="profile-input"
                value={form.last_name}
                disabled
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Email</label>
              <input
                type="email"
                className="profile-input"
                value={form.email}
                disabled
              />
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

      {/* Professional Info Tab */}
      {activeTab === 1 && (
        <>
          {/* Credentials — admin-managed, read-only */}
          <div className="profile-section">
            <h2 className="profile-section-title">Credentials</h2>
            <p className="profile-admin-notice">
              <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', verticalAlign: '-0.125em', fill: 'currentColor', marginRight: '0.3rem' }} aria-hidden="true"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
              Credentials are verified and managed by administration. Contact HR to request updates.
            </p>

            <div className="profile-credential-grid">
              <div className="profile-credential-card">
                <span className="profile-credential-label">License Number</span>
                <span className="profile-credential-value">{profile.license_number || '—'}</span>
              </div>
              <div className="profile-credential-card">
                <span className="profile-credential-label">Specialization</span>
                <span className="profile-credential-value">
                  {SPECIALIZATIONS.find((s) => s.value === profile.specialization)?.label || '—'}
                </span>
              </div>
              <div className="profile-credential-card">
                <span className="profile-credential-label">Years of Experience</span>
                <span className="profile-credential-value">{profile.years_experience}</span>
              </div>
            </div>
          </div>

          {/* Editable professional info */}
          <form className="profile-section" onSubmit={handleSaveProfessional}>
            <h2 className="profile-section-title">Editable Details</h2>

            <div className="profile-form-grid">
              <div className="profile-field">
                <label className="profile-label">Consultation Fee ($)</label>
                <input
                  type="number"
                  className="profile-input"
                  step="0.01"
                  min="0"
                  value={profile.consultation_fee}
                  onChange={(e) => setProfile({ ...profile, consultation_fee: e.target.value })}
                />
              </div>
            </div>

            <div className="profile-field" style={{ marginTop: '1rem' }}>
              <label className="profile-label">Bio</label>
              <textarea
                className="profile-textarea"
                rows={4}
                placeholder="Tell patients about your background and areas of expertise…"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </div>

            <div className="profile-form-actions">
              <button type="submit" className="profile-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </>
      )}

      {/* Schedule Tab */}
      {activeTab === 2 && (
        <form className="profile-section" onSubmit={handleSaveSchedule}>
          <h2 className="profile-section-title">Availability Schedule</h2>

          <div className="profile-field" style={{ marginBottom: '1.5rem' }}>
            <label className="profile-label">Available Days</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`profile-day-btn ${schedule.available_days.includes(day) ? 'active' : ''}`}
                  onClick={() => toggleDay(day)}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label className="profile-label">Working Hours Start</label>
              <input
                type="time"
                className="profile-input"
                value={schedule.working_hours_start}
                onChange={(e) => setSchedule({ ...schedule, working_hours_start: e.target.value })}
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Working Hours End</label>
              <input
                type="time"
                className="profile-input"
                value={schedule.working_hours_end}
                onChange={(e) => setSchedule({ ...schedule, working_hours_end: e.target.value })}
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Slot Duration (minutes)</label>
              <select
                className="profile-input"
                value={schedule.slot_duration}
                onChange={(e) => setSchedule({ ...schedule, slot_duration: e.target.value })}
              >
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="profile-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      )}

      {/* Schedule Conflict Warning Modal */}
      {conflictModal && (
        <div className="sched-modal-overlay" onClick={() => setConflictModal(null)}>
          <div className="sched-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sched-modal-header">
              <span className="sched-modal-icon">⚠️</span>
              <h3>Schedule Conflict Warning</h3>
            </div>
            <p className="sched-modal-message">{conflictModal.message}</p>

            <div className="sched-conflict-list">
              {conflictModal.conflicts.map((c) => (
                <div key={c.id} className="sched-conflict-item">
                  <div className="sched-conflict-patient">{c.patient_name}</div>
                  <div className="sched-conflict-detail">
                    {new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {' at '}
                    {(() => {
                      const [h, m] = c.time.split(':');
                      const d = new Date();
                      d.setHours(parseInt(h), parseInt(m));
                      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    })()}
                  </div>
                  <div className="sched-conflict-reason">{c.reason}</div>
                </div>
              ))}
            </div>

            <p className="sched-modal-note">
              Confirming will <strong>cancel</strong> these appointments and notify patients.
            </p>

            <div className="sched-modal-actions">
              <button className="sched-modal-cancel" onClick={() => setConflictModal(null)}>
                Go Back
              </button>
              <button className="sched-modal-confirm" onClick={handleForceSchedule} disabled={saving}>
                {saving ? 'Updating...' : 'Confirm & Cancel Appointments'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
