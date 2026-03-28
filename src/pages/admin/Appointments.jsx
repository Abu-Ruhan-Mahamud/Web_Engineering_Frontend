import { useState, useEffect, useCallback, useRef } from 'react';
import api, { getResults } from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import '../../styles/admin.css';

const STATUS_OPTIONS = [
  'All', 'scheduled', 'confirmed', 'in_progress', 'completed',
  'cancelled', 'no_show', 'rescheduled',
];

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const abortRef = useRef(null);

  const fetchAppointments = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/admin/appointments/', { params, signal: controller.signal });
      setAppointments(getResults(res.data));
    } catch {
      if (controller.signal.aborted) return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [statusFilter, debouncedSearch, dateFrom, dateTo]);

  useEffect(() => {
    setLoading(true);
    fetchAppointments();
  }, [fetchAppointments]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/appointments/export/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'appointments_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // error handled silently
    } finally {
      setExporting(false);
    }
  };

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

  const statusLabel = (s) => s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  // Group by status for summary bar
  const statusCounts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Appointments</h1>
          <p className="admin-page-subtitle">View and manage all system appointments</p>
        </div>
        <button
          className="admin-btn admin-btn-outline"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* ─── Quick Status Summary ───────────────── */}
      <div className="admin-appt-summary">
        {STATUS_OPTIONS.slice(1).map((s) => (
          <div
            key={s}
            className={`admin-appt-summary-chip ${statusFilter === s ? 'active' : ''}`}
            style={{ borderColor: statusColor(s), color: statusFilter === s ? '#fff' : statusColor(s), backgroundColor: statusFilter === s ? statusColor(s) : 'transparent' }}
            onClick={() => setStatusFilter(statusFilter === s ? 'All' : s)}
          >
            <span className="admin-appt-chip-count">{statusCounts[s] || 0}</span>
            <span className="admin-appt-chip-label">{statusLabel(s)}</span>
          </div>
        ))}
      </div>

      {/* ─── Filters ────────────────────────────── */}
      <div className="admin-filters">
        <div className="admin-filter-row">
          <input
            type="text"
            placeholder="Search by patient or doctor name…"
            className="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="admin-date-range">
            <label>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <label>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Appointments Table ─────────────────── */}
      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>Loading appointments…</p>
        </div>
      ) : (
        <div className="admin-card admin-full-width">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>#{a.id}</td>
                    <td className="admin-td-name">{a.patient_name}</td>
                    <td className="admin-td-name">{a.doctor_name}</td>
                    <td>{a.appointment_date}</td>
                    <td>{formatTime(a.appointment_time)}</td>
                    <td>
                      <span
                        className="admin-status-chip"
                        style={{
                          backgroundColor: statusColor(a.status) + '20',
                          color: statusColor(a.status),
                        }}
                      >
                        {statusLabel(a.status)}
                      </span>
                    </td>
                    <td className="admin-td-truncate">{a.reason || '—'}</td>
                    <td className="admin-td-truncate">{a.notes || '—'}</td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="admin-empty-row">No appointments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-table-footer">
            <span>{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found</span>
          </div>
        </div>
      )}
    </div>
  );
}
