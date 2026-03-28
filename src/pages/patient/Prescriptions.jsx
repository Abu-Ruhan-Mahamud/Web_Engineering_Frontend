import { useState, useEffect } from 'react';
import api, { getResults } from '../../services/api';
import '../../styles/prescriptions.css';

export default function PatientPrescriptions() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const fetchRecords = async () => {
      try {
        const res = await api.get('/records/', { signal: controller.signal });
        setRecords(getResults(res.data));
      } catch {
        if (controller.signal.aborted) return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchRecords();
    return () => controller.abort();
  }, []);

  // Flatten prescriptions from all records, keeping the visit context
  const allPrescriptions = records
    .filter((r) => r.prescriptions?.length > 0)
    .flatMap((r) =>
      r.prescriptions.map((rx) => ({
        ...rx,
        visit_date: r.created_at,
        doctor_name: r.doctor_name,
        diagnosis: r.diagnosis,
        record_id: r.id,
      }))
    )
    .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

  // Client-side search across medication name, doctor, diagnosis
  const filtered = allPrescriptions.filter((rx) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (rx.medication_name || '').toLowerCase().includes(q) ||
      (rx.doctor_name || '').toLowerCase().includes(q) ||
      (rx.dosage || '').toLowerCase().includes(q) ||
      (rx.diagnosis || []).some((d) => d.toLowerCase().includes(q))
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group prescriptions by visit date + record
  const grouped = filtered.reduce((acc, rx) => {
    const key = `${rx.record_id}`;
    if (!acc[key]) {
      acc[key] = {
        record_id: rx.record_id,
        visit_date: rx.visit_date,
        doctor_name: rx.doctor_name,
        diagnosis: rx.diagnosis,
        items: [],
      };
    }
    acc[key].items.push(rx);
    return acc;
  }, {});

  const groups = Object.values(grouped).sort(
    (a, b) => new Date(b.visit_date) - new Date(a.visit_date)
  );

  if (loading) {
    return (
      <div className="dash-empty">
        <p>Loading prescriptions…</p>
      </div>
    );
  }

  return (
    <>
      <div className="rx-page-header">
        <div>
          <h1 className="rx-page-title">My Prescriptions</h1>
          <p className="rx-page-subtitle">
            All medications prescribed during your visits
          </p>
        </div>
        <div className="rx-stats">
          <div className="rx-stat">
            <span className="rx-stat-number">{allPrescriptions.length}</span>
            <span className="rx-stat-label">Total Prescriptions</span>
          </div>
          <div className="rx-stat">
            <span className="rx-stat-number">{groups.length}</span>
            <span className="rx-stat-label">Visits</span>
          </div>
        </div>
      </div>

      <div className="rx-filters">
        <input
          className="rx-search"
          placeholder="Search by medication, doctor, or diagnosis…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {groups.length === 0 ? (
        <div className="dash-empty">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14H9v-2h2v2zm0-4H9V7h2v6zm4 4h-2v-4h2v4zm0-6h-2V7h2v4z" />
          </svg>
          <p>{searchTerm ? 'No prescriptions match your search' : 'No prescriptions found'}</p>
        </div>
      ) : (
        <div className="rx-groups">
          {groups.map((group) => (
            <div key={group.record_id} className="rx-visit-card">
              <div className="rx-visit-header">
                <div className="rx-visit-info">
                  <div className="rx-visit-date">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
                    {formatDate(group.visit_date)}
                  </div>
                  <div className="rx-visit-doctor">{group.doctor_name}</div>
                </div>
                {group.diagnosis?.length > 0 && (
                  <div className="rx-diagnosis-badges">
                    {group.diagnosis.map((d, i) => (
                      <span key={i} className="rx-diagnosis-badge">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rx-items">
                {group.items.map((rx) => (
                  <div key={rx.id} className="rx-item">
                    <div className="rx-item-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                        <path d="M4.22 11.29l4.95-4.95a3.5 3.5 0 014.95 0l4.95 4.95a3.5 3.5 0 010 4.95l-4.95 4.95a3.5 3.5 0 01-4.95 0l-4.95-4.95a3.5 3.5 0 010-4.95zM12 8v4m0 0v4m0-4h4m-4 0H8" />
                      </svg>
                    </div>
                    <div className="rx-item-details">
                      <div className="rx-item-name">{rx.medication_name}</div>
                      <div className="rx-item-meta">
                        <span className="rx-item-dosage">{rx.dosage}</span>
                        <span className="rx-item-sep">·</span>
                        <span className="rx-item-frequency">{rx.frequency}</span>
                        {rx.duration && (
                          <>
                            <span className="rx-item-sep">·</span>
                            <span className="rx-item-duration">{rx.duration}</span>
                          </>
                        )}
                      </div>
                      {rx.notes && (
                        <div className="rx-item-notes">{rx.notes}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
