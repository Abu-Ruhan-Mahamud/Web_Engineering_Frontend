import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { getResults } from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import '../../styles/admin.css';

const USER_TYPE_FILTERS = ['All', 'patient', 'doctor', 'admin', 'lab_tech'];

const SPECIALIZATIONS = [
  'general_practice', 'cardiology', 'dermatology', 'endocrinology',
  'gastroenterology', 'neurology', 'oncology', 'ophthalmology',
  'orthopedics', 'pediatrics', 'psychiatry', 'pulmonology',
  'radiology', 'urology',
];

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [toggling, setToggling] = useState(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    user_type: 'doctor',
    license_number: '',
    specialization: '',
    years_experience: '',
  });

  const debouncedSearch = useDebounce(search, 300);

  const abortRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const params = {};
      if (typeFilter !== 'All') params.user_type = typeFilter;
      if (activeFilter !== 'all') params.is_active = activeFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const res = await api.get('/admin/users/', { params, signal: controller.signal });
      setUsers(getResults(res.data));
    } catch {
      if (controller.signal.aborted) return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [typeFilter, activeFilter, debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (user) => {
    setToggling(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/`, { is_active: !user.is_active });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
    } catch {
      // error handled silently
    } finally {
      setToggling(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const payload = { ...form };
      if (form.user_type !== 'doctor') {
        delete payload.license_number;
        delete payload.specialization;
        delete payload.years_experience;
      } else {
        payload.years_experience = parseInt(form.years_experience, 10) || 0;
      }
      await api.post('/admin/users/', payload);
      setShowCreateModal(false);
      setForm({
        email: '', password: '', first_name: '', last_name: '', phone: '',
        user_type: 'doctor', license_number: '', specialization: '', years_experience: '',
      });
      fetchUsers();
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        setCreateError(msgs.join(' | '));
      } else {
        setCreateError('Failed to create user.');
      }
    } finally {
      setCreating(false);
    }
  };

  const userTypeLabel = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const statusLabel = (s) => s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">View, create, and manage user accounts</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create User
        </button>
      </div>

      {/* ─── Filters ────────────────────────────── */}
      <div className="admin-filters">
        <div className="admin-filter-tabs">
          {USER_TYPE_FILTERS.map((t) => (
            <button
              key={t}
              className={`admin-filter-tab ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'All' ? 'All Users' : statusLabel(t) + 's'}
            </button>
          ))}
        </div>
        <div className="admin-filter-row">
          <input
            type="text"
            placeholder="Search by name or email…"
            className="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="admin-select"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* ─── Users Table ────────────────────────── */}
      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>Loading users…</p>
        </div>
      ) : (
        <div className="admin-card admin-full-width">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={!u.is_active ? 'admin-row-inactive' : ''}>
                    <td>#{u.id}</td>
                    <td className="admin-td-name">{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`admin-user-type-badge admin-badge-${u.user_type}`}>
                        {userTypeLabel(u.user_type)}
                      </span>
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className={`admin-active-badge ${u.is_active ? 'active' : 'inactive'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {u.id === currentUser?.id ? (
                        <span className="admin-btn admin-btn-sm admin-btn-ghost" style={{ cursor: 'default' }}>You</span>
                      ) : (
                        <button
                          className={`admin-btn admin-btn-sm ${u.is_active ? 'admin-btn-danger' : 'admin-btn-success'}`}
                          onClick={() => handleToggleActive(u)}
                          disabled={toggling === u.id}
                        >
                          {toggling === u.id ? '…' : u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="admin-empty-row">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-table-footer">
            <span>{users.length} user{users.length !== 1 ? 's' : ''} found</span>
          </div>
        </div>
      )}

      {/* ─── Create User Modal ──────────────────── */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Create New User</h2>
              <button className="admin-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>First Name *</label>
                  <input
                    type="text" required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Last Name *</label>
                  <input
                    type="text" required
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
                <div className="admin-form-group admin-form-full">
                  <label>Email *</label>
                  <input
                    type="email" required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Password *</label>
                  <input
                    type="password" required minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="admin-form-group admin-form-full">
                  <label>Account Type *</label>
                  <select
                    value={form.user_type}
                    onChange={(e) => setForm({ ...form, user_type: e.target.value })}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                    <option value="lab_tech">Lab Technician</option>
                  </select>
                </div>

                {form.user_type === 'doctor' && (
                  <>
                    <div className="admin-form-group">
                      <label>License Number *</label>
                      <input
                        type="text" required
                        value={form.license_number}
                        onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Specialization *</label>
                      <select
                        required
                        value={form.specialization}
                        onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      >
                        <option value="">Select…</option>
                        {SPECIALIZATIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label>Years of Experience</label>
                      <input
                        type="number" min={0}
                        value={form.years_experience}
                        onChange={(e) => setForm({ ...form, years_experience: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              {createError && <div className="admin-form-error">{createError}</div>}

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
