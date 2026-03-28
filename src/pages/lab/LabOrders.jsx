import { useState, useEffect, useCallback } from 'react';
import api, { getResults } from '../../services/api';
import { getCategoryIcon } from '../../utils/categoryIcons';
import {
  getTemplatesForCategory,
  getTemplateById,
  isStructuredTemplate,
  compileStructuredResult,
  compileNarrativeFindings,
} from '../../utils/labTemplates';
import '../../styles/lab.css';

const STATUS_TABS = [
  { key: 'ordered', label: 'New Orders' },
  { key: 'sample_collected', label: 'Sample Collected' },
  { key: 'processing', label: 'Processing' },
];

const PRIORITY_CLASS = {
  routine: 'lab-priority-routine',
  urgent: 'lab-priority-urgent',
  stat: 'lab-priority-stat',
};

const INTERPRETATION_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'abnormal', label: 'Abnormal' },
  { value: 'critical', label: 'Critical' },
];

/** Categories that use structured numeric results (value, range, unit) */
const STRUCTURED_CATEGORIES = ['blood', 'urine', 'cardiac'];

function isStructuredCategory(category) {
  return STRUCTURED_CATEGORIES.includes(category);
}

export default function LabOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ordered');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [paramValues, setParamValues] = useState([]);       // [{name, value, unit, referenceRange}]
  const [sectionTexts, setSectionTexts] = useState([]);      // [{section, prompt, text}]

  // Structured fields (manual / no-template fallback)
  const [resultValue, setResultValue] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [unit, setUnit] = useState('');

  // Narrative fields
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');

  // Common fields
  const [interpretation, setInterpretation] = useState('normal');
  const [notes, setNotes] = useState('');
  const [resultFile, setResultFile] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/lab-tests/', { params: { status: activeTab } });
      setOrders(getResults(res.data));
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    setError('');
    try {
      await api.patch(`/lab-tests/${orderId}/`, { status: newStatus });
      fetchOrders();
      setSuccess(`Order #${orderId} status updated.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update status.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openUploadModal = (order) => {
    setSelectedOrder(order);
    setSelectedTemplateId('');
    setParamValues([]);
    setSectionTexts([]);
    setResultValue('');
    setReferenceRange('');
    setUnit('');
    setFindings('');
    setImpression('');
    setInterpretation('normal');
    setNotes('');
    setResultFile(null);
    setError('');
  };

  /** When a template is chosen from the dropdown */
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setParamValues([]);
      setSectionTexts([]);
      return;
    }
    const tpl = getTemplateById(templateId);
    if (!tpl) return;
    if (isStructuredTemplate(tpl)) {
      setParamValues(tpl.parameters.map((p) => ({
        name: p.name,
        value: '',
        unit: p.unit,
        referenceRange: p.referenceRange,
      })));
      setSectionTexts([]);
    } else {
      setSectionTexts(tpl.sections.map((s) => ({
        section: s.section,
        prompt: s.prompt,
        text: '',
      })));
      setParamValues([]);
    }
  };

  const updateParamValue = (index, value) => {
    setParamValues((prev) => prev.map((p, i) => i === index ? { ...p, value } : p));
  };

  const handleUploadResult = async (e) => {
    e.preventDefault();
    const structured = isStructuredCategory(selectedOrder.test_category);
    const tpl = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;
    const usingStructuredTpl = tpl && isStructuredTemplate(tpl);
    const usingNarrativeTpl = tpl && !isStructuredTemplate(tpl);

    // ── Validation ──
    if (usingStructuredTpl) {
      const hasAnyValue = paramValues.some((p) => p.value.trim());
      if (!hasAnyValue) {
        setError('Enter at least one parameter value.');
        return;
      }
    } else if (usingNarrativeTpl) {
      const hasAnyText = sectionTexts.some((s) => s.text.trim());
      if (!hasAnyText) {
        setError('Enter findings for at least one section.');
        return;
      }
    } else if (structured && !resultValue.trim()) {
      setError('Result value is required for this test type.');
      return;
    } else if (!structured && !findings.trim()) {
      setError('Findings are required for this test type.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('interpretation', interpretation);
    formData.append('notes', notes);

    if (usingStructuredTpl) {
      // Compile parameters into JSON for result_value
      formData.append('result_value', compileStructuredResult(tpl.id, paramValues));
      formData.append('reference_range', '');
      formData.append('unit', '');
    } else if (usingNarrativeTpl) {
      formData.append('findings', compileNarrativeFindings(sectionTexts));
      formData.append('impression', impression);
    } else if (structured) {
      formData.append('result_value', resultValue);
      formData.append('reference_range', referenceRange);
      formData.append('unit', unit);
    } else {
      formData.append('findings', findings);
      formData.append('impression', impression);
    }

    if (resultFile) {
      formData.append('result_file', resultFile);
    }

    try {
      await api.post(`/lab-tests/${selectedOrder.id}/result/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedOrder(null);
      setSuccess('Result uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to upload result.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getNextStatus = (s) => ({ ordered: 'sample_collected', sample_collected: 'processing' }[s] || null);
  const getNextLabel = (s) => ({ ordered: 'Mark Sample Collected', sample_collected: 'Mark Processing' }[s] || null);

  return (
    <div className="lab-page">
      <div className="lab-page-header">
        <h1>Lab Orders</h1>
        <p>View pending lab test orders and upload results</p>
      </div>

      {success && <div className="lab-success">{success}</div>}

      <div className="lab-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`lab-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lab-loading"><div className="lab-spinner" /><p>Loading orders…</p></div>
      ) : orders.length === 0 ? (
        <div className="lab-empty">
          <svg viewBox="0 0 24 24" className="lab-empty-icon">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
          </svg>
          <p>No orders in this category.</p>
        </div>
      ) : (
        <div className="lab-order-list">
          {orders.map((order) => (
            <div key={order.id} className="lab-order-card">
              <div className="lab-order-top">
                <div className="lab-order-info">
                  <div className="lab-order-test-name">
                    <span className="lab-cat-icon">{getCategoryIcon(order.test_category)}</span>
                    {order.test_name}
                  </div>
                  <div className="lab-order-meta">
                    <span className="lab-order-category">{order.test_category}</span>
                    <span className={`lab-priority-badge ${PRIORITY_CLASS[order.priority]}`}>
                      {order.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="lab-order-id">#{order.id}</div>
              </div>
              <div className="lab-order-details">
                <div className="lab-order-detail-row">
                  <span className="lab-detail-label">Patient</span>
                  <span className="lab-detail-value">{order.patient_name}</span>
                </div>
                <div className="lab-order-detail-row">
                  <span className="lab-detail-label">Ordered By</span>
                  <span className="lab-detail-value">{order.doctor_name}</span>
                </div>
                <div className="lab-order-detail-row">
                  <span className="lab-detail-label">Ordered</span>
                  <span className="lab-detail-value">{formatDate(order.ordered_at)}</span>
                </div>
                {order.clinical_notes && (
                  <div className="lab-order-detail-row lab-notes-full">
                    <span className="lab-detail-label">Clinical Notes</span>
                    <span className="lab-detail-value">{order.clinical_notes}</span>
                  </div>
                )}
              </div>
              <div className="lab-order-actions">
                {getNextStatus(order.status) && (
                  <button
                    className="lab-btn lab-btn-secondary"
                    onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status))}
                    disabled={updatingStatus === order.id}
                  >
                    {updatingStatus === order.id ? '…' : getNextLabel(order.status)}
                  </button>
                )}
                {order.status === 'processing' && (
                  <button className="lab-btn lab-btn-primary" onClick={() => openUploadModal(order)}>
                    Upload Result
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Context-Aware Upload Result Modal ─── */}
      {selectedOrder && (
        <div className="lab-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="lab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lab-modal-header">
              <h2>Upload Result</h2>
              <button className="lab-modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="lab-modal-order-info">
              <div className="lab-modal-order-name">
                <span className="lab-cat-icon">{getCategoryIcon(selectedOrder.test_category)}</span>
                <strong>{selectedOrder.test_name}</strong>
              </div>
              <div className="lab-modal-order-detail">
                {selectedOrder.patient_name}
                <span className="lab-sep">·</span>
                <span style={{ textTransform: 'capitalize' }}>{selectedOrder.test_category}</span>
              </div>
            </div>

            <div className={`lab-form-type-indicator ${isStructuredCategory(selectedOrder.test_category) ? 'structured' : 'narrative'}`}>
              {isStructuredCategory(selectedOrder.test_category)
                ? 'Structured Result — Values, ranges, and units'
                : 'Narrative Report — Findings and impression'}
            </div>

            <form onSubmit={handleUploadResult}>
              {/* ─── Template Picker ─── */}
              {(() => {
                const templates = getTemplatesForCategory(selectedOrder.test_category);
                if (templates.length === 0) return null;
                return (
                  <div className="lab-form-group">
                    <label>Use Template</label>
                    <select
                      className="lab-select lab-template-select"
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                    >
                      <option value="">— Manual entry (no template) —</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {/* ─── STRUCTURED TEMPLATE: parameter rows ─── */}
              {selectedTemplateId && paramValues.length > 0 && (
                <div className="lab-template-params">
                  <div className="lab-param-header">
                    <span>Parameter</span>
                    <span>Value</span>
                    <span>Unit</span>
                    <span>Reference</span>
                  </div>
                  {paramValues.map((p, i) => (
                    <div key={p.name} className="lab-param-row">
                      <span className="lab-param-name">{p.name}</span>
                      <input
                        type="text"
                        className="lab-input lab-param-input"
                        placeholder="—"
                        value={p.value}
                        onChange={(e) => updateParamValue(i, e.target.value)}
                      />
                      <span className="lab-param-unit">{p.unit}</span>
                      <span className="lab-param-ref">{p.referenceRange}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── NARRATIVE TEMPLATE: section prompts ─── */}
              {selectedTemplateId && sectionTexts.length > 0 && (
                <div className="lab-template-sections">
                  {sectionTexts.map((s, i) => (
                    <div key={s.section} className="lab-form-group">
                      <label>{s.section}</label>
                      <textarea
                        className="lab-textarea"
                        placeholder={s.prompt}
                        value={s.text}
                        onChange={(e) => {
                          setSectionTexts((prev) =>
                            prev.map((sec, j) => j === i ? { ...sec, text: e.target.value } : sec)
                          );
                        }}
                        rows={3}
                      />
                    </div>
                  ))}
                  <div className="lab-form-group">
                    <label>Impression / Conclusion</label>
                    <textarea
                      className="lab-textarea"
                      placeholder="Summary diagnosis or conclusion…"
                      value={impression}
                      onChange={(e) => setImpression(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* ─── MANUAL STRUCTURED (no template) ─── */}
              {!selectedTemplateId && isStructuredCategory(selectedOrder.test_category) && (
                <>
                  <div className="lab-form-group">
                    <label>Result Value <span className="lab-required">*</span></label>
                    <textarea
                      className="lab-textarea"
                      placeholder="Enter test result values&#10;e.g. WBC: 7.2, RBC: 4.8, Hemoglobin: 14.2 g/dL, Hematocrit: 42%"
                      value={resultValue}
                      onChange={(e) => setResultValue(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="lab-form-row">
                    <div className="lab-form-group">
                      <label>Reference Range</label>
                      <input
                        type="text"
                        className="lab-input"
                        placeholder="e.g. 4.5–11.0"
                        value={referenceRange}
                        onChange={(e) => setReferenceRange(e.target.value)}
                      />
                    </div>
                    <div className="lab-form-group">
                      <label>Unit</label>
                      <input
                        type="text"
                        className="lab-input"
                        placeholder="e.g. 10³/µL"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ─── MANUAL NARRATIVE (no template) ─── */}
              {!selectedTemplateId && !isStructuredCategory(selectedOrder.test_category) && (
                <>
                  <div className="lab-form-group">
                    <label>Findings <span className="lab-required">*</span></label>
                    <textarea
                      className="lab-textarea lab-textarea-large"
                      placeholder={
                        selectedOrder.test_category === 'imaging'
                          ? 'Describe radiological findings in detail…\n\ne.g. Heart size is normal. Lungs are clear bilaterally. No pleural effusion or pneumothorax. Mediastinal contours are within normal limits.'
                          : selectedOrder.test_category === 'pathology'
                            ? 'Describe histological / cytological findings…\n\ne.g. Sections show benign breast tissue with mild fibrocystic changes. No atypia or malignancy identified.'
                            : 'Describe microbiological findings…\n\ne.g. Culture: Escherichia coli isolated. Sensitivity: Susceptible to Amoxicillin, Ciprofloxacin. Resistant to Ampicillin.'
                      }
                      value={findings}
                      onChange={(e) => setFindings(e.target.value)}
                      rows={7}
                    />
                  </div>
                  <div className="lab-form-group">
                    <label>Impression / Conclusion</label>
                    <textarea
                      className="lab-textarea"
                      placeholder="Summary diagnosis or conclusion…&#10;e.g. No acute cardiopulmonary abnormality."
                      value={impression}
                      onChange={(e) => setImpression(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="lab-form-group">
                <label>Interpretation</label>
                <select
                  className="lab-select"
                  value={interpretation}
                  onChange={(e) => setInterpretation(e.target.value)}
                >
                  {INTERPRETATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="lab-form-group">
                <label>Additional Notes</label>
                <textarea
                  className="lab-textarea"
                  placeholder="Additional notes, recommendations…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="lab-form-group">
                <label>
                  Attach Report File
                  {!isStructuredCategory(selectedOrder.test_category) && (
                    <span className="lab-file-hint"> (recommended)</span>
                  )}
                </label>
                <input
                  type="file"
                  className="lab-input-file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.dcm"
                  onChange={(e) => setResultFile(e.target.files[0] || null)}
                />
              </div>

              {error && <div className="lab-form-error">{error}</div>}

              <div className="lab-modal-actions">
                <button type="button" className="lab-btn lab-btn-ghost" onClick={() => setSelectedOrder(null)}>
                  Cancel
                </button>
                <button type="submit" className="lab-btn lab-btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading…' : 'Upload Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
