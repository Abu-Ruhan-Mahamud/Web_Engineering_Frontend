import { useState, useEffect, useCallback } from 'react';
import api, { getResults } from '../../services/api';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { parseTemplateResult, getTemplateById } from '../../utils/labTemplates';
import '../../styles/lab.css';

const RESULT_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

const PENDING_STATUSES = ['ordered', 'sample_collected', 'processing'];
const COMPLETED_STATUSES = ['results_available', 'reviewed'];

const STATUS_LABELS = {
  ordered: 'Ordered',
  sample_collected: 'Sample Collected',
  processing: 'Processing',
  results_available: 'Results Available',
  reviewed: 'Reviewed',
};

const STRUCTURED_CATEGORIES = ['blood', 'urine', 'cardiac'];

function isStructured(category) {
  return STRUCTURED_CATEGORIES.includes(category);
}

export default function LabResults() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);

  const fetchTests = useCallback(async () => {
    try {
      const res = await api.get('/lab-tests/');
      setTests(getResults(res.data));
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const filteredTests =
    activeTab === 'pending'
      ? tests.filter((t) => PENDING_STATUSES.includes(t.status))
      : tests.filter((t) => COMPLETED_STATUSES.includes(t.status));

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  /** Render the professional report card for a completed test */
  const renderReport = (test) => {
    const r = test.result;
    if (!r) return null;
    const structured = isStructured(test.test_category);

    return (
      <div className="report-container">
        {/* ─── Report Header ─── */}
        <div className="report-header">
          <div className="report-header-left">
            <div className="report-title">
              {getCategoryIcon(test.test_category)}{' '}
              {structured ? 'Laboratory Report' : test.test_category === 'imaging' ? 'Radiology Report' : test.test_category === 'pathology' ? 'Pathology Report' : 'Diagnostic Report'}
            </div>
            <div className="report-subtitle">{test.test_name}</div>
          </div>
          <div className={`report-interp-badge interp-${r.interpretation}`}>
            {r.interpretation === 'normal' ? '✓ Normal' : r.interpretation === 'abnormal' ? '⚠ Abnormal' : '⚠ Critical'}
          </div>
        </div>

        {/* ─── Report Info Bar ─── */}
        <div className="report-info-bar">
          <div className="report-info-item">
            <span className="report-info-label">Ordered</span>
            <span className="report-info-value">{formatDate(test.ordered_at)}</span>
          </div>
          <div className="report-info-item">
            <span className="report-info-label">Completed</span>
            <span className="report-info-value">{formatDate(test.completed_at)}</span>
          </div>
          <div className="report-info-item">
            <span className="report-info-label">Ordering Physician</span>
            <span className="report-info-value">{test.doctor_name}</span>
          </div>
          {test.status === 'reviewed' && test.reviewed_at && (
            <div className="report-info-item">
              <span className="report-info-label">Reviewed</span>
              <span className="report-info-value">{formatDate(test.reviewed_at)}</span>
            </div>
          )}
        </div>

        {/* ─── Result Body ─── */}
        {structured ? (
          /* Structured report — table-like layout */
          <div className="report-section">
            <div className="report-section-title">Test Results</div>
            {(() => {
              const tplData = parseTemplateResult(r.result_value);
              if (tplData) {
                // Template-based: multi-row parameter table
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
              // Legacy: single-row display
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
          /* Narrative report — findings + impression */
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
            {/* Fallback: if old data uses result_value instead of findings */}
            {!r.findings && r.result_value && (
              <div className="report-section">
                <div className="report-section-title">Results</div>
                <div className="report-narrative">{r.result_value}</div>
              </div>
            )}
          </>
        )}

        {/* ─── Notes ─── */}
        {r.notes && (
          <div className="report-section">
            <div className="report-section-title">Notes</div>
            <div className="report-notes">{r.notes}</div>
          </div>
        )}

        {/* ─── Attached File ─── */}
        {r.result_file && (
          <div className="report-attachment">
            <a href={r.result_file} target="_blank" rel="noopener noreferrer" className="report-file-link"
              onClick={(e) => e.stopPropagation()}>
              <svg viewBox="0 0 24 24" className="report-file-icon">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
              </svg>
              View Attached Report
            </a>
          </div>
        )}

        {/* ─── Report Footer ─── */}
        <div className="report-footer">
          {r.uploaded_by_name && (
            <span>Reported by: {r.uploaded_by_name}</span>
          )}
          {r.uploaded_at && (
            <span>{formatDateTime(r.uploaded_at)}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="lab-results-page">
      <div className="lab-results-page-header">
        <h1>Lab Results</h1>
        <p>View your lab test orders and results</p>
      </div>

      <div className="lab-results-tabs">
        {RESULT_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`lab-results-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="lab-tab-count">
              {tab.key === 'pending'
                ? tests.filter((t) => PENDING_STATUSES.includes(t.status)).length
                : tests.filter((t) => COMPLETED_STATUSES.includes(t.status)).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lab-loading"><div className="lab-spinner" /><p>Loading lab results…</p></div>
      ) : filteredTests.length === 0 ? (
        <div className="lab-empty">
          <svg viewBox="0 0 24 24" className="lab-empty-icon">
            <path d="M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z" />
          </svg>
          <p>{activeTab === 'pending' ? 'No pending lab tests.' : 'No completed lab results yet.'}</p>
        </div>
      ) : activeTab === 'pending' ? (
        /* ─── Pending Tests: simple tracking cards ─── */
        <div className="lab-pending-list">
          {filteredTests.map((test) => (
            <div key={test.id} className="lab-tracking-card">
              <div className="lab-tracking-top">
                <div className="lab-tracking-name">
                  <span className="lab-cat-icon">{getCategoryIcon(test.test_category)}</span>
                  {test.test_name}
                </div>
                <span className={`lab-result-status lab-status-${test.status}`}>
                  {STATUS_LABELS[test.status]}
                </span>
              </div>
              <div className="lab-tracking-meta">
                <span>Ordered by {test.doctor_name}</span>
                <span>{formatDate(test.ordered_at)}</span>
              </div>
              {/* Progress tracker */}
              <div className="lab-progress">
                {['ordered', 'sample_collected', 'processing', 'results_available'].map((step, i) => {
                  const stepIndex = ['ordered', 'sample_collected', 'processing', 'results_available'].indexOf(test.status);
                  const thisIndex = i;
                  const done = thisIndex <= stepIndex;
                  return (
                    <div key={step} className={`lab-progress-step ${done ? 'done' : ''}`}>
                      <div className="lab-progress-dot" />
                      {i < 3 && <div className="lab-progress-line" />}
                      <span className="lab-progress-label">
                        {['Ordered', 'Sample', 'Processing', 'Results'][i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ─── Completed Tests: professional report cards ─── */
        <div className="lab-completed-list">
          {filteredTests.map((test) => (
            <div key={test.id} className="lab-report-wrapper">
              {/* Summary bar — always visible */}
              <div
                className={`lab-report-summary ${expandedId === test.id ? 'expanded' : ''}`}
                onClick={() => toggleExpand(test.id)}
              >
                <div className="lab-report-summary-left">
                  <span className="lab-cat-icon">{getCategoryIcon(test.test_category)}</span>
                  <div>
                    <div className="lab-report-summary-name">{test.test_name}</div>
                    <div className="lab-report-summary-meta">
                      {formatDate(test.completed_at || test.ordered_at)}
                      <span className="lab-sep">·</span>
                      <span style={{ textTransform: 'capitalize' }}>{test.test_category}</span>
                    </div>
                  </div>
                </div>
                <div className="lab-report-summary-right">
                  {test.result && (
                    <span className={`report-interp-pill interp-${test.result.interpretation}`}>
                      {test.result.interpretation.charAt(0).toUpperCase() + test.result.interpretation.slice(1)}
                    </span>
                  )}
                  <span className={`lab-result-status lab-status-${test.status}`}>
                    {STATUS_LABELS[test.status]}
                  </span>
                  <svg className={`lab-expand-chevron ${expandedId === test.id ? 'open' : ''}`} viewBox="0 0 24 24">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                  </svg>
                </div>
              </div>

              {/* Expanded report */}
              {expandedId === test.id && renderReport(test)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
