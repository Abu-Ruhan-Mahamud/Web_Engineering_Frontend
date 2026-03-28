import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getResults } from '../../services/api';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { parseTemplateResult, getTemplateById } from '../../utils/labTemplates';
import '../../styles/doctor-patients.css';
import '../../styles/lab.css';

export default function PatientDetail() {
  const { patientId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [labTests, setLabTests] = useState([]);
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [detailRes, labRes] = await Promise.all([
          api.get(`/auth/doctor/patients/${patientId}/`),
          api.get('/lab-tests/', { params: { patient: patientId } }),
        ]);
        setData(detailRes.data);
        setLabTests(getResults(labRes.data));
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [patientId]);

  const handleReviewLabTest = async (testId) => {
    setReviewingId(testId);
    try {
      const res = await api.patch(`/lab-tests/${testId}/`, { status: 'reviewed' });
      setLabTests((prev) =>
        prev.map((t) => (t.id === testId ? res.data : t))
      );
    } catch {
      // silently handle
    } finally {
      setReviewingId(null);
    }
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="doc-loading">
        <div className="doc-spinner" />
      </div>
    );
  }

  if (!data) {
    return <div className="doc-empty-state">Patient not found.</div>;
  }

  const { patient, appointments, medical_records, medications } = data;
  const fullName = `${patient.first_name} ${patient.last_name}`;

  return (
    <div className="doc-patient-detail">
      {/* Back */}
      <Link to="/doctor/patients" className="doc-detail-back">
        <svg viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back to Patients
      </Link>

      {/* Patient Header */}
      <div className="doc-pt-header">
        <div className="doc-pt-avatar-lg">{getInitials(fullName)}</div>
        <div className="doc-pt-header-info">
          <h1>{fullName}</h1>
          <div className="doc-pt-meta">
            {patient.gender && (
              <div className="doc-pt-meta-item">
                <svg viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                {patient.date_of_birth && `, ${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}y`}
              </div>
            )}
            {patient.phone && (
              <div className="doc-pt-meta-item">
                <svg viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                {patient.phone}
              </div>
            )}
            {patient.email && (
              <div className="doc-pt-meta-item">
                <svg viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                {patient.email}
              </div>
            )}
          </div>
        </div>
        <div className="doc-pt-actions">
          <Link
            to={`/doctor/patients/${patientId}/create-record`}
            className="doc-pt-action-btn"
          >
            <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', verticalAlign: '-0.125em', fill: 'currentColor', marginRight: '0.4rem' }} aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            Create Record
          </Link>
        </div>
      </div>

      {/* Content Grid */}
      <div className="doc-detail-grid">
        {/* Left Column */}
        <div>
          {/* Patient Information */}
          <div className="doc-detail-card" style={{ marginBottom: '1.5rem' }}>
            <h2>Patient Information</h2>
            <div className="doc-info-row">
              <div className="doc-info-label">Patient ID</div>
              <div className="doc-info-value">PT-{String(patient.id).padStart(4, '0')}</div>
            </div>
            {patient.date_of_birth && (
              <div className="doc-info-row">
                <div className="doc-info-label">Date of Birth</div>
                <div className="doc-info-value">{formatDate(patient.date_of_birth)}</div>
              </div>
            )}
            {patient.blood_type && (
              <div className="doc-info-row">
                <div className="doc-info-label">Blood Type</div>
                <div className="doc-info-value">{patient.blood_type}</div>
              </div>
            )}
            <div className="doc-info-row">
              <div className="doc-info-label">Email</div>
              <div className="doc-info-value">{patient.email}</div>
            </div>
            {patient.emergency_contact_name && (
              <div className="doc-info-row">
                <div className="doc-info-label">Emergency</div>
                <div className="doc-info-value">{patient.emergency_contact_name} {patient.emergency_contact_phone && `— ${patient.emergency_contact_phone}`}</div>
              </div>
            )}
          </div>

          {/* Allergies */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="doc-detail-card" style={{ marginBottom: '1.5rem' }}>
              <h2>Allergies</h2>
              <div className="doc-allergy-list">
                {patient.allergies.map((allergy, i) => (
                  <span key={i} className="doc-allergy-badge">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Medications */}
          <div className="doc-detail-card">
            <h2>Current Medications</h2>
            {medications.length === 0 ? (
              <div className="doc-empty-state">No current medications</div>
            ) : (
              medications.map((med, i) => (
                <div key={i} className="doc-med-item">
                  <div className="doc-med-name">{med.name}</div>
                  <div className="doc-med-dosage">
                    {med.dosage} — {med.frequency}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column — Tabbed */}
        <div className="doc-detail-card">
          <div className="doc-tabs">
            {[
              { key: 'history', label: 'Medical History' },
              { key: 'appointments', label: 'Appointments' },
              { key: 'lab_tests', label: 'Lab Tests' },
            ].map((t) => (
              <button
                key={t.key}
                className={`doc-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'history' && (
            <div className="doc-timeline">
              {medical_records.length === 0 ? (
                <div className="doc-empty-state">No medical records</div>
              ) : (
                medical_records.map((rec) => (
                  <div key={rec.id} className="doc-timeline-item">
                    <div className="doc-timeline-date">
                      {formatDate(rec.created_at)}
                    </div>
                    <div className="doc-timeline-card">
                      <div className="doc-timeline-title">
                        {rec.chief_complaint || 'Consultation'}
                      </div>
                      <div className="doc-timeline-desc">
                        {rec.diagnosis && (
                          <div>
                            <strong>Diagnosis:</strong>{' '}
                            {Array.isArray(rec.diagnosis)
                              ? rec.diagnosis.join(', ')
                              : rec.diagnosis}
                          </div>
                        )}
                        {rec.treatment_plan && (
                          <div style={{ marginTop: '0.3rem' }}>
                            <strong>Treatment:</strong> {rec.treatment_plan}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="doc-appointment-list">
              {appointments.length === 0 ? (
                <div className="doc-empty-state">No appointments</div>
              ) : (
                appointments.map((apt) => (
                  <div key={apt.id} className="doc-appointment-item">
                    <div className="doc-time-box">
                      <div className="time">{formatDate(apt.appointment_date)}</div>
                      <div className="duration">{apt.appointment_time ? apt.appointment_time.slice(0,5) : ''}</div>
                    </div>
                    <div className="doc-apt-info">
                      <div className="doc-apt-name">
                        {apt.reason || 'Consultation'}
                      </div>
                    </div>
                    <span className={`doc-status-badge ${apt.status}`}>
                      {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'lab_tests' && (
            <div className="doc-timeline">
              {labTests.length === 0 ? (
                <div className="doc-empty-state">No lab tests ordered</div>
              ) : (
                labTests.map((test) => {
                  const r = test.result;
                  const structured = ['blood', 'urine', 'cardiac'].includes(test.test_category);

                  return (
                    <div key={test.id} className="lab-report-card-doctor">
                      {/* Card Header */}
                      <div className="lab-dr-card-header">
                        <div className="lab-dr-card-title">
                          <span className="lab-cat-icon">{getCategoryIcon(test.test_category)}</span>
                          <span>{test.test_name}</span>
                        </div>
                        <div className="lab-dr-card-badges">
                          {test.priority !== 'routine' && (
                            <span className={`lab-priority-badge lab-priority-${test.priority}`}>
                              {test.priority.toUpperCase()}
                            </span>
                          )}
                          <span className={`lab-result-status lab-status-${test.status}`}>
                            {test.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="lab-dr-card-meta">
                        <span style={{ textTransform: 'capitalize' }}>{test.test_category}</span>
                        <span className="lab-sep">·</span>
                        <span>{formatDate(test.ordered_at)}</span>
                        {test.completed_at && (
                          <>
                            <span className="lab-sep">·</span>
                            <span>Completed {formatDate(test.completed_at)}</span>
                          </>
                        )}
                      </div>

                      {/* Result — professional report format */}
                      {r && (
                        <div className="report-container report-compact">
                          {/* Interpretation badge */}
                          <div className="report-interp-row">
                            <span className={`report-interp-badge interp-${r.interpretation}`}>
                              {r.interpretation === 'normal' ? '✓ Normal' : r.interpretation === 'abnormal' ? '⚠ Abnormal' : '⚠ Critical'}
                            </span>
                            {r.uploaded_by_name && (
                              <span className="report-uploaded-by">Reported by {r.uploaded_by_name}</span>
                            )}
                          </div>

                          {structured ? (
                            <div className="report-section">
                              <div className="report-section-title">Test Results</div>
                              {(() => {
                                const tplData = parseTemplateResult(r.result_value);
                                if (tplData) {
                                  const tpl = getTemplateById(tplData.__template);
                                  return (
                                    <div className="report-structured-table">
                                      <div className="report-table-row report-table-header">
                                        <span>Parameter</span>
                                        <span>Value</span>
                                        <span>Unit</span>
                                        <span>Reference</span>
                                      </div>
                                      {tplData.parameters.map((p) => (
                                        <div key={p.name} className="report-table-row">
                                          <span className="report-param-name">{p.name}</span>
                                          <span className="report-param-value">{p.value || '—'}</span>
                                          <span>{p.unit || '—'}</span>
                                          <span className="report-param-ref">{p.referenceRange || '—'}</span>
                                        </div>
                                      ))}
                                      {tpl && (
                                        <div className="report-table-footer">
                                          Template: {tpl.name}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                return (
                                  <div className="report-structured-table">
                                    <div className="report-table-row report-table-header">
                                      <span>Parameter / Value</span>
                                      <span>Reference Range</span>
                                      <span>Unit</span>
                                      <span>Flag</span>
                                    </div>
                                    <div className="report-table-row">
                                      <span className="report-value-text">{r.result_value}</span>
                                      <span>{r.reference_range || '—'}</span>
                                      <span>{r.unit || '—'}</span>
                                      <span className={`report-flag flag-${r.interpretation}`}>
                                        {r.interpretation === 'normal' ? 'Normal' : r.interpretation === 'abnormal' ? 'High/Low' : 'CRITICAL'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <>
                              {r.findings && (
                                <div className="report-section">
                                  <div className="report-section-title">Findings</div>
                                  <div className="report-narrative">{r.findings}</div>
                                </div>
                              )}
                              {r.impression && (
                                <div className="report-section">
                                  <div className="report-section-title">Impression</div>
                                  <div className="report-narrative report-impression">{r.impression}</div>
                                </div>
                              )}
                              {!r.findings && r.result_value && (
                                <div className="report-section">
                                  <div className="report-section-title">Results</div>
                                  <div className="report-narrative">{r.result_value}</div>
                                </div>
                              )}
                            </>
                          )}

                          {r.notes && (
                            <div className="report-section">
                              <div className="report-section-title">Notes</div>
                              <div className="report-notes">{r.notes}</div>
                            </div>
                          )}

                          {r.result_file && (
                            <div className="report-attachment">
                              <a href={r.result_file} target="_blank" rel="noopener noreferrer" className="report-file-link">
                                <svg viewBox="0 0 24 24" className="report-file-icon">
                                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                                </svg>
                                View Attached Report
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Review action */}
                      {test.status === 'results_available' && (
                        <div className="lab-dr-review-action">
                          <button
                            className="lab-review-btn"
                            onClick={() => handleReviewLabTest(test.id)}
                            disabled={reviewingId === test.id}
                          >
                            {reviewingId === test.id ? 'Reviewing…' : '✓ Mark as Reviewed'}
                          </button>
                        </div>
                      )}

                      {test.status === 'reviewed' && test.reviewed_at && (
                        <div className="lab-dr-reviewed-info">
                          ✓ Reviewed on {formatDate(test.reviewed_at)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
