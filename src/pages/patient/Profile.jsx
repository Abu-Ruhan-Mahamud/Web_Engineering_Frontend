import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import '../../styles/profile.css';

const TABS = ['Personal Info', 'Medical Info', 'Security'];
const BLOOD_TYPES = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['', 'male', 'female', 'other'];

export default function PatientProfile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);

  // Personal form
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  // Medical form
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [addingAllergy, setAddingAllergy] = useState(false);
  const [addingCondition, setAddingCondition] = useState(false);

  // Security
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Profile picture and account deletion
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get('/auth/profile/'),
        api.get('/auth/dashboard-stats/'),
      ]);
      const data = profileRes.data;
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        date_of_birth: data.profile?.date_of_birth || '',
        gender: data.profile?.gender || '',
        blood_type: data.profile?.blood_type || '',
        address: data.profile?.address || '',
        emergency_contact_name: data.profile?.emergency_contact_name || '',
        emergency_contact_phone: data.profile?.emergency_contact_phone || '',
      });
      setAllergies(data.profile?.allergies || []);
      setConditions(data.profile?.chronic_conditions || []);
      setStats(statsRes.data);
    } catch {
      // silently handle profile load failure
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      const res = await api.put('/auth/profile/', form);
      updateUser({
        ...user,
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        phone: res.data.phone,
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      // save failed silently
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMedical = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      await api.put('/auth/profile/', { allergies, chronic_conditions: conditions });
      setSuccess('Medical info updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setSuccess('Failed to save medical info. Please try again.');
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const addTag = (type) => {
    if (type === 'allergy' && newAllergy.trim()) {
      setAllergies((prev) => [...prev, newAllergy.trim()]);
      setNewAllergy('');
      setAddingAllergy(false);
    } else if (type === 'condition' && newCondition.trim()) {
      setConditions((prev) => [...prev, newCondition.trim()]);
      setNewCondition('');
      setAddingCondition(false);
    }
  };

  const removeTag = (type, index) => {
    if (type === 'allergy') {
      setAllergies((prev) => prev.filter((_, i) => i !== index));
    } else {
      setConditions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const memberSince = () => {
    if (!user?.created_at) return '—';
    const created = new Date(user.created_at);
    const now = new Date();
    const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    if (months < 1) return 'New';
    if (months < 12) return `${months}mo`;
    return `${Math.floor(months / 12)}y`;
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!profilePictureFile) return;
    
    setUploadingPicture(true);
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('profile_picture', profilePictureFile);
      
      // Must NOT set Content-Type header for FormData — let axios/browser handle it
      const res = await api.put('/auth/me/', formData, {
        headers: { 'Content-Type': undefined },
      });
      
      // Update user context with full path from response
      const newPicturePath = res.data.profile_picture;
      updateUser({ ...user, profile_picture: newPicturePath });
      setProfilePictureFile(null);
      setSuccess('Profile picture updated successfully!');
      setShowPhotoModal(false); // Auto-close modal after successful upload
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.profile_picture?.[0] || 'Failed to upload profile picture. Please try again.';
      setSuccess(errMsg);
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    setUploadingPicture(true);
    setSuccess('');
    try {
      const res = await api.put('/auth/me/', { profile_picture: null }, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      updateUser({ ...user, profile_picture: null });
      setProfilePictureFile(null);
      setSuccess('Profile picture removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setSuccess('Failed to remove profile picture. Please try again.');
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const response = await api.post('/auth/delete-account/');
      // Show success message
      setSuccess(
        '✓ Account deleted successfully. Your medical records are retained per healthcare regulations. Redirecting…'
      );
      setShowDeleteConfirm(false);
      
      // Clear auth state after brief delay to show message
      setTimeout(() => {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to delete account. Please try again.';
      setSuccess(errorMsg);
      setShowDeleteConfirm(false);
      setDeletingAccount(false);
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="dash-empty">
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <>
      <div className="profile-page-header">
        <h1 className="profile-page-title">My Profile</h1>
        <p className="profile-page-subtitle">
          Manage your personal information and account settings
        </p>
      </div>

      {success && <div className="profile-success">{success}</div>}

      <div className="profile-grid">
        {/* Left — Avatar card */}
        <div className="dash-card profile-avatar-section">
          <div className="avatar-upload">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="Profile" className="avatar-large" />
            ) : (
              <div className="avatar-large-placeholder">{initials}</div>
            )}
            <button
              type="button"
              className="avatar-edit-button"
              onClick={() => setShowPhotoModal(true)}
              title="Edit photo"
            >
              ✎
            </button>
          </div>

          {/* Photo edit modal */}
          {showPhotoModal && (
            <div className="photo-modal-overlay" onClick={() => !profilePictureFile && setShowPhotoModal(false)}>
              <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="photo-modal-title">Update Profile Photo</h3>
                
                {/* File input */}
                <label htmlFor="profile-picture-input" className="photo-upload-label">
                  <input
                    id="profile-picture-input"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    style={{ display: 'none' }}
                  />
                  <div className="photo-upload-button">Choose from device</div>
                </label>

                {/* Preview section */}
                {profilePictureFile && (
                  <div className="photo-preview-section">
                    <img
                      src={URL.createObjectURL(profilePictureFile)}
                      alt="Preview"
                      className="photo-preview-image"
                    />
                    <p className="photo-preview-filename">{profilePictureFile.name}</p>
                    <div className="photo-modal-actions">
                      <button
                        type="button"
                        className="photo-action-cancel"
                        onClick={() => setProfilePictureFile(null)}
                        disabled={uploadingPicture}
                      >
                        Choose different
                      </button>
                      <button
                        type="button"
                        className="photo-action-upload"
                        onClick={handleUploadProfilePicture}
                        disabled={uploadingPicture}
                      >
                        {uploadingPicture ? 'Uploading...' : 'Save photo'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remove photo option */}
                {user?.profile_picture && !profilePictureFile && (
                  <button
                    type="button"
                    className="photo-remove-option"
                    onClick={handleDeleteProfilePicture}
                    disabled={uploadingPicture}
                  >
                    Remove current photo
                  </button>
                )}

                {/* Close button */}
                {!profilePictureFile && (
                  <button
                    type="button"
                    className="photo-modal-close"
                    onClick={() => setShowPhotoModal(false)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="profile-name">
            {form.first_name} {form.last_name}
          </div>
          <div className="profile-id">
            Patient ID: PT-{String(user?.id || 0).padStart(4, '0')}
          </div>

          <div className="profile-stats">
            <div className="profile-stat-box">
              <div className="profile-stat-value">{stats?.total_appointments ?? 0}</div>
              <div className="profile-stat-label">Total Visits</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-value">{stats?.active_medications ?? 0}</div>
              <div className="profile-stat-label">Active Meds</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-value">{stats?.upcoming_appointments ?? 0}</div>
              <div className="profile-stat-label">Upcoming</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-value">{memberSince()}</div>
              <div className="profile-stat-label">Member Since</div>
            </div>
          </div>
        </div>

        {/* Right — Tabbed form */}
        <div className="dash-card">
          <div className="profile-tabs">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                className={`profile-tab ${activeTab === idx ? 'active' : ''}`}
                onClick={() => setActiveTab(idx)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ─── Personal Info ─── */}
          {activeTab === 0 && (
            <form onSubmit={handleSavePersonal}>
              <div className="profile-form-section">
                <div className="profile-section-title">Basic Information</div>
                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label className="profile-form-label">First Name</label>
                    <input
                      className="profile-form-input"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="profile-form-group">
                    <label className="profile-form-label">Last Name</label>
                    <input
                      className="profile-form-input"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="profile-form-input"
                      name="date_of_birth"
                      value={form.date_of_birth}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="profile-form-group">
                    <label className="profile-form-label">Gender</label>
                    <select
                      className="profile-form-select"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                    >
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g ? g.charAt(0).toUpperCase() + g.slice(1) : 'Select…'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Blood Group</label>
                  <select
                    className="profile-form-select"
                    name="blood_type"
                    value={form.blood_type}
                    onChange={handleChange}
                  >
                    {BLOOD_TYPES.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt || 'Select…'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="profile-form-section">
                <div className="profile-section-title">Contact Information</div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Email Address</label>
                  <input className="profile-form-input" value={user?.email || ''} disabled />
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Phone Number</label>
                  <input
                    className="profile-form-input"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Address</label>
                  <textarea
                    className="profile-form-textarea"
                    name="address"
                    rows={3}
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="profile-form-section">
                <div className="profile-section-title">Emergency Contact</div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Emergency Contact Name</label>
                  <input
                    className="profile-form-input"
                    name="emergency_contact_name"
                    value={form.emergency_contact_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Emergency Phone</label>
                  <input
                    className="profile-form-input"
                    name="emergency_contact_phone"
                    value={form.emergency_contact_phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="profile-form-actions">
                <button type="button" className="profile-btn-cancel" onClick={fetchProfile}>
                  Cancel
                </button>
                <button type="submit" className="profile-btn-save" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* ─── Medical Info ─── */}
          {activeTab === 1 && (
            <form onSubmit={handleSaveMedical}>
              <div className="profile-form-section">
                <div className="profile-section-title">Allergies</div>
                <div className="profile-tag-container">
                  {allergies.map((a, i) => (
                    <span key={i} className="profile-tag">
                      {a}
                      <span className="profile-tag-remove" onClick={() => removeTag('allergy', i)}>
                        ×
                      </span>
                    </span>
                  ))}
                </div>
                {addingAllergy ? (
                  <div className="profile-tag-add-row">
                    <input
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="Allergy name…"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('allergy'))}
                      autoFocus
                    />
                    <button type="button" onClick={() => addTag('allergy')}>
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="profile-add-tag-btn"
                    onClick={() => setAddingAllergy(true)}
                  >
                    + Add Allergy
                  </button>
                )}
              </div>

              <div className="profile-form-section">
                <div className="profile-section-title">Chronic Conditions</div>
                <div className="profile-tag-container">
                  {conditions.map((c, i) => (
                    <span key={i} className="profile-tag">
                      {c}
                      <span
                        className="profile-tag-remove"
                        onClick={() => removeTag('condition', i)}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
                {addingCondition ? (
                  <div className="profile-tag-add-row">
                    <input
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      placeholder="Condition name…"
                      onKeyDown={(e) =>
                        e.key === 'Enter' && (e.preventDefault(), addTag('condition'))
                      }
                      autoFocus
                    />
                    <button type="button" onClick={() => addTag('condition')}>
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="profile-add-tag-btn"
                    onClick={() => setAddingCondition(true)}
                  >
                    + Add Condition
                  </button>
                )}
              </div>

              <div className="profile-form-actions">
                <button type="button" className="profile-btn-cancel" onClick={fetchProfile}>
                  Cancel
                </button>
                <button type="submit" className="profile-btn-save" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* ─── Security ─── */}
          {activeTab === 2 && (
            <>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSuccess('');
                  if (!passwords.current_password || !passwords.new_password || !passwords.confirm_password) {
                    setSuccess('');
                    return;
                  }
                  if (passwords.new_password !== passwords.confirm_password) {
                    setSuccess('New passwords do not match.');
                    setTimeout(() => setSuccess(''), 3000);
                    return;
                  }
                  if (passwords.new_password.length < 8) {
                    setSuccess('Password must be at least 8 characters.');
                    setTimeout(() => setSuccess(''), 3000);
                    return;
                  }
                  setSaving(true);
                  try {
                    const res = await api.post('/auth/change-password/', {
                      current_password: passwords.current_password,
                      new_password: passwords.new_password,
                      confirm_password: passwords.confirm_password,
                    });
                    // Update token in localStorage after successful change
                    if (res.data.token) {
                      localStorage.setItem('token', res.data.token);
                    }
                    setPasswords({ current_password: '', new_password: '', confirm_password: '' });
                    setSuccess('Password changed successfully!');
                    setTimeout(() => setSuccess(''), 3000);
                  } catch (err) {
                    const data = err.response?.data;
                    const msg = data?.current_password?.[0] || data?.new_password?.[0] || data?.confirm_password?.[0] || data?.detail || 'Failed to change password.';
                    setSuccess(msg);
                    setTimeout(() => setSuccess(''), 5000);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <div className="profile-form-section">
                  <div className="profile-section-title">Change Password</div>
                  <div className="profile-form-group">
                    <label className="profile-form-label">Current Password</label>
                    <input
                      type="password"
                      className="profile-form-input"
                      placeholder="Enter current password"
                      value={passwords.current_password}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, current_password: e.target.value }))
                      }
                    />
                  </div>
                  <div className="profile-form-group">
                    <label className="profile-form-label">New Password</label>
                    <input
                      type="password"
                      className="profile-form-input"
                      placeholder="Enter new password"
                      value={passwords.new_password}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, new_password: e.target.value }))
                      }
                    />
                    <div style={{ marginTop: '0.8rem' }}>
                      <div className="profile-password-req">
                        <div
                          className={`profile-req-icon ${passwords.new_password.length >= 8 ? 'met' : ''}`}
                        />
                        At least 8 characters
                      </div>
                      <div className="profile-password-req">
                        <div
                          className={`profile-req-icon ${/[a-z]/.test(passwords.new_password) && /[A-Z]/.test(passwords.new_password) ? 'met' : ''}`}
                        />
                        Contains uppercase and lowercase letters
                      </div>
                      <div className="profile-password-req">
                        <div
                          className={`profile-req-icon ${/\d/.test(passwords.new_password) ? 'met' : ''}`}
                        />
                        Contains at least one number
                      </div>
                    </div>
                  </div>
                  <div className="profile-form-group">
                    <label className="profile-form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="profile-form-input"
                      placeholder="Confirm new password"
                      value={passwords.confirm_password}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, confirm_password: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="profile-form-actions">
                  <button type="button" className="profile-btn-cancel" onClick={() => setPasswords({ current_password: '', new_password: '', confirm_password: '' })}>
                    Cancel
                  </button>
                  <button type="submit" className="profile-btn-save" disabled={saving}>
                    {saving ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </form>

              <div className="profile-danger-zone">
                <div className="profile-danger-title">Danger Zone</div>
                <div className="profile-danger-text">
                  Permanently delete your account and all associated data.
                </div>
                <button
                  type="button"
                  className="profile-btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </button>
              </div>

              {/* Delete account confirmation modal */}
              {showDeleteConfirm && (
                <div className="profile-delete-modal-overlay">
                  <div className="profile-delete-modal-content">
                    <h2 className="profile-delete-modal-title">Delete Account?</h2>
                    <p className="profile-delete-modal-text">
                      This action cannot be undone. Your account and all medical records will be permanently deactivated.
                    </p>
                    <div className="profile-delete-modal-actions">
                      <button
                        type="button"
                        className="profile-btn-cancel"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deletingAccount}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="profile-delete-modal-confirm"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                      >
                        {deletingAccount ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
