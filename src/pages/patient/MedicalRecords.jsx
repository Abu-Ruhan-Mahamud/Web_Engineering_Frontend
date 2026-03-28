import { useState, useEffect } from 'react';
import api, { getResults } from '../../services/api';
import '../../styles/medical-records.css';

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());

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

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Simple client-side search
  const filtered = records.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (r.doctor_name || '').toLowerCase().includes(q) ||
      (r.chief_complaint || '').toLowerCase().includes(q) ||
      (r.diagnosis || []).some((d) => d.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="dash-empty">
        <p>Loading medical records…</p>
      </div>
    );
  }

  return (
    <>
      <div className="records-page-header">
        <h1 className="records-page-title">Medical Records</h1>
        <p className="records-page-subtitle">
          View your consultation history and diagnoses
        </p>
      </div>

      <div className="records-filters">
        <input
          className="records-search"
          placeholder="Search by doctor, diagnosis, or complaint…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="dash-empty">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
          <p>No medical records found</p>
        </div>
      ) : (
        <div className="records-list">
          {filtered.map((record) => {
            const isOpen = expandedIds.has(record.id);
            return (
              <div key={record.id} className="record-card">
                {/* Header */}
                <div className="record-header">
                  <div className="record-header-info">
                    <div className="record-date">{formatDate(record.created_at)}</div>
                    <div className="record-doctor">{record.doctor_name}</div>
                  </div>
                  <button
                    className="record-expand-btn"
                    onClick={() => toggleExpand(record.id)}
                  >
                    {isOpen ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                {/* Expandable body */}
                <div className={`record-body ${isOpen ? 'open' : ''}`}>
                  {record.chief_complaint && (
                    <div className="record-section">
                      <div className="record-section-label">Chief Complaint</div>
                      <div className="record-section-content">{record.chief_complaint}</div>
                    </div>
                  )}

                  {record.diagnosis?.length > 0 && (
                    <div className="record-section">
                      <div className="record-section-label">Diagnosis</div>
                      <div className="record-diagnosis-badges">
                        {record.diagnosis.map((d, i) => (
                          <span key={i} className="record-diagnosis-badge">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.symptoms?.length > 0 && (
                    <div className="record-section">
                      <div className="record-section-label">Symptoms</div>
                      <div className="record-symptom-badges">
                        {record.symptoms.map((s, i) => (
                          <span key={i} className="record-symptom-badge">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.vitals && Object.keys(record.vitals).length > 0 && (
                    <div className="record-section">
                      <div className="record-section-label">Vitals</div>
                      <div className="record-vitals-grid">
                        {Object.entries(record.vitals).map(([key, val]) => (
                          <div key={key} className="record-vital-item">
                            <div className="record-vital-label">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </div>
                            <div className="record-vital-value">{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.treatment_plan && (
                    <div className="record-section">
                      <div className="record-section-label">Treatment Plan</div>
                      <div className="record-section-content">{record.treatment_plan}</div>
                    </div>
                  )}

                  {record.examination_notes && (
                    <div className="record-section">
                      <div className="record-section-label">Examination Notes</div>
                      <div className="record-section-content">{record.examination_notes}</div>
                    </div>
                  )}

                  {record.prescriptions?.length > 0 && (
                    <div className="record-section">
                      <div className="record-section-label">Prescriptions</div>
                      <div className="record-prescriptions-grid">
                        {record.prescriptions.map((rx) => (
                          <div key={rx.id} className="record-prescription-item">
                            <div className="record-rx-name">{rx.medication_name}</div>
                            <div className="record-rx-detail">{rx.dosage}</div>
                            <div className="record-rx-detail">{rx.frequency}</div>
                            {rx.duration && (
                              <div className="record-rx-detail">Duration: {rx.duration}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.follow_up_date && (
                    <div className="record-section">
                      <div className="record-section-label">Follow-up Date</div>
                      <div className="record-section-content">
                        {formatDate(record.follow_up_date)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="record-footer">
                  <span>Record #{record.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
