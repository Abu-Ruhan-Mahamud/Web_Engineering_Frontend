import { useState, useEffect, useCallback } from 'react';
import api, { getResults } from '../../services/api';
import '../../styles/medications.css';

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [expandedMed, setExpandedMed] = useState(null);

  const fetchMedications = useCallback(async () => {
    try {
      const params = {};
      if (filter === 'active') params.active = 'true';
      else if (filter === 'inactive') params.active = 'false';
      const res = await api.get('/medications/', { params });
      setMedications(getResults(res.data));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchMedications();
  }, [fetchMedications]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const activeCount = medications.filter((m) => m.is_active).length;

  if (loading) {
    return (
      <div className="dash-empty">
        <p>Loading medications…</p>
      </div>
    );
  }

  return (
    <>
      <div className="med-page-header">
        <div>
          <h1 className="med-page-title">My Medications</h1>
          <p className="med-page-subtitle">
            View your prescribed medications — reminders are sent automatically
          </p>
        </div>
        <div className="med-stats">
          <div className="med-stat">
            <span className="med-stat-number">
              {filter === 'inactive'
                ? medications.length
                : filter === 'all'
                  ? medications.length
                  : activeCount}
            </span>
            <span className="med-stat-label">
              {filter === 'inactive' ? 'Inactive' : filter === 'all' ? 'Total' : 'Active'} Medications
            </span>
          </div>
        </div>
      </div>

      <div className="med-filters">
        {['active', 'inactive', 'all'].map((f) => (
          <button
            key={f}
            className={`med-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {medications.length === 0 ? (
        <div className="dash-empty">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
            <path d="M4.22 11.29l4.95-4.95a3.5 3.5 0 014.95 0l4.95 4.95a3.5 3.5 0 010 4.95l-4.95 4.95a3.5 3.5 0 01-4.95 0l-4.95-4.95a3.5 3.5 0 010-4.95z" fill="none" stroke="#94a3b8" strokeWidth="1.5"/>
          </svg>
          <p>No {filter !== 'all' ? filter : ''} medications found</p>
        </div>
      ) : (
        <div className="med-list">
          {medications.map((med) => (
            <div key={med.id} className={`med-card ${!med.is_active ? 'inactive' : ''}`}>
              <div
                className="med-card-main"
                onClick={() => setExpandedMed(expandedMed === med.id ? null : med.id)}
              >
                <div className="med-card-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22">
                    <path d="M4.22 11.29l4.95-4.95a3.5 3.5 0 014.95 0l4.95 4.95a3.5 3.5 0 010 4.95l-4.95 4.95a3.5 3.5 0 01-4.95 0l-4.95-4.95a3.5 3.5 0 010-4.95z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="med-card-info">
                  <div className="med-card-name">{med.name}</div>
                  <div className="med-card-meta">
                    <span className="med-card-dosage">{med.dosage}</span>
                    <span className="med-card-sep">·</span>
                    <span className="med-card-frequency">{med.frequency}</span>
                  </div>
                  {med.prescribed_by_name && (
                    <div className="med-card-doctor">Prescribed by {med.prescribed_by_name}</div>
                  )}
                </div>
                <div className="med-card-right">
                  <span className={`med-status-badge ${med.is_active ? 'active' : 'inactive'}`}>
                    {med.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <svg className={`med-card-chevron ${expandedMed === med.id ? 'open' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                    <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {expandedMed === med.id && (
                <div className="med-card-expanded">
                  <div className="med-detail-grid">
                    <div className="med-detail-item">
                      <span className="med-detail-label">Dosage</span>
                      <span className="med-detail-value">{med.dosage}</span>
                    </div>
                    <div className="med-detail-item">
                      <span className="med-detail-label">Frequency</span>
                      <span className="med-detail-value">{med.frequency}</span>
                    </div>
                    <div className="med-detail-item">
                      <span className="med-detail-label">Start Date</span>
                      <span className="med-detail-value">{formatDate(med.start_date)}</span>
                    </div>
                    <div className="med-detail-item">
                      <span className="med-detail-label">End Date</span>
                      <span className="med-detail-value">{formatDate(med.end_date)}</span>
                    </div>
                    {med.prescribed_by_name && (
                      <div className="med-detail-item">
                        <span className="med-detail-label">Prescribed By</span>
                        <span className="med-detail-value">{med.prescribed_by_name}</span>
                      </div>
                    )}
                    {med.notes && (
                      <div className="med-detail-item full-width">
                        <span className="med-detail-label">Notes</span>
                        <span className="med-detail-value">{med.notes}</span>
                      </div>
                    )}
                  </div>

                  {med.is_active && (
                    <div className="med-auto-reminder-note">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>
                      </svg>
                      Reminders are sent automatically based on your prescription schedule
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
