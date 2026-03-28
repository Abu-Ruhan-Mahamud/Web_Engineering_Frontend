import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/doctor-records.css';

const EMPTY_RX = {
  medication_name: '',
  dosage: '',
  frequency: 'Once daily',
  duration: '',
  instructions: '',
};

const EMPTY_LAB = {
  test_name: '',
  test_category: 'blood',
  priority: 'routine',
  clinical_notes: '',
};

const LAB_CATEGORIES = [
  { value: 'blood', label: 'Blood Test' },
  { value: 'urine', label: 'Urine Test' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'cardiac', label: 'Cardiac' },
  { value: 'pathology', label: 'Pathology' },
  { value: 'microbiology', label: 'Microbiology' },
  { value: 'other', label: 'Other' },
];

const LAB_PRIORITIES = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'stat', label: 'STAT' },
];

export default function CreateRecord() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [diagnosisTags, setDiagnosisTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([{ ...EMPTY_RX }]);
  const [labTests, setLabTests] = useState([]);

  useEffect(() => {
    api
      .get(`/auth/doctor/patients/${patientId}/`)
      .then((res) => setPatient(res.data.patient))
      .catch(() => setError('Failed to load patient info'))
      .finally(() => setLoading(false));
  }, [patientId]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Tag management
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!diagnosisTags.includes(tagInput.trim())) {
        setDiagnosisTags([...diagnosisTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setDiagnosisTags(diagnosisTags.filter((_, i) => i !== index));
  };

  // Prescription management
  const addPrescription = () => {
    setPrescriptions([...prescriptions, { ...EMPTY_RX }]);
  };

  const removePrescription = (index) => {
    if (prescriptions.length === 1) return;
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const updatePrescription = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  // Lab test management
  const addLabTest = () => {
    setLabTests([...labTests, { ...EMPTY_LAB }]);
  };

  const removeLabTest = (index) => {
    setLabTests(labTests.filter((_, i) => i !== index));
  };

  const updateLabTest = (index, field, value) => {
    const updated = [...labTests];
    updated[index] = { ...updated[index], [field]: value };
    setLabTests(updated);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!chiefComplaint.trim()) {
      setError('Chief complaint is required.');
      return;
    }

    setSubmitting(true);

    // Build diagnosis list
    const allDiagnoses = [];
    if (primaryDiagnosis.trim()) allDiagnoses.push(primaryDiagnosis.trim());
    allDiagnoses.push(...diagnosisTags);

    // Build vitals
    const vitals = {};
    if (bloodPressure) vitals.blood_pressure = bloodPressure;
    if (heartRate) vitals.heart_rate = heartRate;
    if (temperature) vitals.temperature = temperature;
    if (weight) vitals.weight = weight;

    // Build symptoms list
    const symptomList = symptoms
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Filter valid prescriptions
    const validRx = prescriptions
      .filter((rx) => rx.medication_name.trim())
      .map((rx) => ({
        medication_name: rx.medication_name,
        dosage: rx.dosage,
        frequency: rx.frequency,
        duration: rx.duration,
        instructions: rx.instructions,
      }));

    const payload = {
      patient: parseInt(patientId),
      chief_complaint: chiefComplaint,
      diagnosis: allDiagnoses,
      symptoms: symptomList,
      examination_notes: examinationNotes,
      treatment_plan: treatmentPlan,
      vitals,
      additional_notes: additionalNotes,
      follow_up_date: followUp || null,
      prescriptions: validRx,
    };

    try {
      await api.post('/records/create/', payload);

      // Submit lab test orders (separate API calls)
      const validLabs = labTests.filter((lt) => lt.test_name.trim());
      for (const lt of validLabs) {
        await api.post('/lab-tests/', {
          patient: parseInt(patientId),
          test_name: lt.test_name,
          test_category: lt.test_category,
          priority: lt.priority,
          clinical_notes: lt.clinical_notes,
        });
      }

      setSuccess('Medical record created successfully!');
      setTimeout(() => {
        navigate(`/doctor/patients/${patientId}`);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data
        ? JSON.stringify(err.response.data)
        : 'Failed to create record.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="doc-loading">
        <div className="doc-spinner" />
      </div>
    );
  }

  const fullName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : 'Patient';

  return (
    <div className="rec-create-page">
      {/* Back */}
      <Link to={`/doctor/patients/${patientId}`} className="doc-detail-back">
        <svg viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back to Patient
      </Link>

      {/* Page Header */}
      <div className="rec-page-header">
        <h1>Create Medical Record</h1>
        <p>Fill in the patient's medical details below</p>
      </div>

      {/* Patient Banner */}
      <div className="rec-patient-banner">
        <div className="rec-patient-avatar">{getInitials(fullName)}</div>
        <div>
          <div className="rec-patient-name">{fullName}</div>
          <div className="rec-patient-sub">
            Patient ID: PT-{String(patientId).padStart(4, '0')}
          </div>
        </div>
      </div>

      {error && <div className="rec-error">{error}</div>}
      {success && <div className="rec-success">{success}</div>}

      {/* Form */}
      <form className="rec-form-card" onSubmit={handleSubmit}>
        {/* Chief Complaint & Symptoms */}
        <div className="rec-section">
          <div className="rec-section-title">Chief Complaint & Symptoms</div>
          <div className="rec-field">
            <label className="rec-label">
              Chief Complaint <span className="rec-required">*</span>
            </label>
            <input
              type="text"
              className="rec-input"
              placeholder="Primary reason for visit"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
            />
          </div>
          <div className="rec-field">
            <label className="rec-label">
              Symptoms <span className="rec-required">*</span>
            </label>
            <textarea
              className="rec-textarea"
              placeholder="Describe symptoms (comma-separated)"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>
        </div>

        {/* Examination & Vitals */}
        <div className="rec-section">
          <div className="rec-section-title">Examination & Vitals</div>
          <div className="rec-row-4">
            <div className="rec-field">
              <label className="rec-label">Blood Pressure</label>
              <input
                type="text"
                className="rec-input"
                placeholder="e.g. 120/80"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
              />
            </div>
            <div className="rec-field">
              <label className="rec-label">Heart Rate</label>
              <input
                type="text"
                className="rec-input"
                placeholder="e.g. 72 bpm"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
              />
            </div>
            <div className="rec-field">
              <label className="rec-label">Temperature</label>
              <input
                type="text"
                className="rec-input"
                placeholder="e.g. 98.6°F"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>
            <div className="rec-field">
              <label className="rec-label">Weight</label>
              <input
                type="text"
                className="rec-input"
                placeholder="e.g. 75 kg"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>
          <div className="rec-field">
            <label className="rec-label">Physical Examination Notes</label>
            <textarea
              className="rec-textarea"
              placeholder="Examination findings..."
              value={examinationNotes}
              onChange={(e) => setExaminationNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Diagnosis & Assessment */}
        <div className="rec-section">
          <div className="rec-section-title">Diagnosis & Assessment</div>
          <div className="rec-field">
            <label className="rec-label">
              Primary Diagnosis <span className="rec-required">*</span>
            </label>
            <input
              type="text"
              className="rec-input"
              placeholder="Primary diagnosis"
              value={primaryDiagnosis}
              onChange={(e) => setPrimaryDiagnosis(e.target.value)}
            />
          </div>
          <div className="rec-field">
            <label className="rec-label">Additional Diagnoses</label>
            <div className="rec-tag-container">
              {diagnosisTags.map((tag, i) => (
                <span key={i} className="rec-tag">
                  {tag}
                  <button
                    type="button"
                    className="rec-tag-remove"
                    onClick={() => removeTag(i)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="rec-tag-input"
                placeholder="Type and press Enter to add..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
            <div className="rec-help">Press Enter to add each diagnosis tag</div>
          </div>
        </div>

        {/* Treatment Plan */}
        <div className="rec-section">
          <div className="rec-section-title">Treatment Plan</div>
          <div className="rec-field">
            <label className="rec-label">
              Treatment Notes <span className="rec-required">*</span>
            </label>
            <textarea
              className="rec-textarea"
              placeholder="Treatment plan details..."
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
            />
          </div>
          <div className="rec-row">
            <div className="rec-field">
              <label className="rec-label">Follow-up Date</label>
              <input
                type="date"
                className="rec-input"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Prescriptions */}
        <div className="rec-section">
          <div className="rec-section-title">Prescriptions</div>
          <div className="rec-prescriptions">
            {prescriptions.map((rx, i) => (
              <div key={i} className="rec-rx-item">
                {prescriptions.length > 1 && (
                  <button
                    type="button"
                    className="rec-rx-remove"
                    onClick={() => removePrescription(i)}
                  >
                    ×
                  </button>
                )}
                <div className="rec-rx-number">Prescription #{i + 1}</div>
                <div className="rec-row">
                  <div className="rec-field">
                    <label className="rec-label">Medication Name</label>
                    <input
                      type="text"
                      className="rec-input"
                      placeholder="e.g. Amoxicillin"
                      value={rx.medication_name}
                      onChange={(e) =>
                        updatePrescription(i, 'medication_name', e.target.value)
                      }
                    />
                  </div>
                  <div className="rec-field">
                    <label className="rec-label">Dosage</label>
                    <input
                      type="text"
                      className="rec-input"
                      placeholder="e.g. 500mg"
                      value={rx.dosage}
                      onChange={(e) =>
                        updatePrescription(i, 'dosage', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="rec-row">
                  <div className="rec-field">
                    <label className="rec-label">Frequency</label>
                    <select
                      className="rec-select"
                      value={rx.frequency}
                      onChange={(e) =>
                        updatePrescription(i, 'frequency', e.target.value)
                      }
                    >
                      <option>Once daily</option>
                      <option>Twice daily</option>
                      <option>Three times daily</option>
                      <option>As needed</option>
                      <option>Every 4 hours</option>
                      <option>Every 6 hours</option>
                    </select>
                  </div>
                  <div className="rec-field">
                    <label className="rec-label">Duration</label>
                    <input
                      type="text"
                      className="rec-input"
                      placeholder="e.g. 7 days"
                      value={rx.duration}
                      onChange={(e) =>
                        updatePrescription(i, 'duration', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="rec-field">
                  <label className="rec-label">Special Instructions</label>
                  <input
                    type="text"
                    className="rec-input"
                    placeholder="e.g. Take after meals"
                    value={rx.instructions}
                    onChange={(e) =>
                      updatePrescription(i, 'instructions', e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
            <button type="button" className="rec-add-rx-btn" onClick={addPrescription}>
              <svg viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Add Prescription
            </button>
          </div>
        </div>

        {/* Lab Tests */}
        <div className="rec-section">
          <div className="rec-section-title">Lab Test Orders</div>
          <div className="rec-prescriptions">
            {labTests.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.8rem' }}>
                No lab tests ordered. Click below to add one.
              </div>
            ) : (
              labTests.map((lt, i) => (
                <div key={i} className="rec-rx-item">
                  <button
                    type="button"
                    className="rec-rx-remove"
                    onClick={() => removeLabTest(i)}
                  >
                    ×
                  </button>
                  <div className="rec-rx-number">Lab Test #{i + 1}</div>
                  <div className="rec-row">
                    <div className="rec-field">
                      <label className="rec-label">Test Name <span className="rec-required">*</span></label>
                      <input
                        type="text"
                        className="rec-input"
                        placeholder="e.g. Complete Blood Count (CBC)"
                        value={lt.test_name}
                        onChange={(e) => updateLabTest(i, 'test_name', e.target.value)}
                      />
                    </div>
                    <div className="rec-field">
                      <label className="rec-label">Category</label>
                      <select
                        className="rec-select"
                        value={lt.test_category}
                        onChange={(e) => updateLabTest(i, 'test_category', e.target.value)}
                      >
                        {LAB_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="rec-row">
                    <div className="rec-field">
                      <label className="rec-label">Priority</label>
                      <select
                        className="rec-select"
                        value={lt.priority}
                        onChange={(e) => updateLabTest(i, 'priority', e.target.value)}
                      >
                        {LAB_PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="rec-field">
                      <label className="rec-label">Clinical Notes</label>
                      <input
                        type="text"
                        className="rec-input"
                        placeholder="Reason / special instructions"
                        value={lt.clinical_notes}
                        onChange={(e) => updateLabTest(i, 'clinical_notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
            <button type="button" className="rec-add-rx-btn" onClick={addLabTest}>
              <svg viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Add Lab Test
            </button>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="rec-section">
          <div className="rec-section-title">Additional Notes</div>
          <div className="rec-field">
            <label className="rec-label">Private Notes</label>
            <textarea
              className="rec-textarea"
              placeholder="Internal notes (not shared with patient)..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="rec-form-actions">
          <button
            type="button"
            className="rec-btn-cancel"
            onClick={() => navigate(`/doctor/patients/${patientId}`)}
          >
            Cancel
          </button>
          <button type="submit" className="rec-btn-submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Medical Record'}
          </button>
        </div>
      </form>
    </div>
  );
}
