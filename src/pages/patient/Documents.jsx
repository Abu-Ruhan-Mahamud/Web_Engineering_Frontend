import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { getResults } from '../../services/api';
import '../../styles/documents.css';

/* ─── SVG Icon Helper ─── */
const I = { width: '1em', height: '1em', verticalAlign: '-0.125em', fill: 'currentColor' };

const SvgFolder = <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>;
const SvgPrescription = <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm5 11h-3v3h-2v-3H7v-2h3v-3h2v3h3v2z"/></svg>;
const SvgHospital = <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>;
const SvgShield = <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>;
const SvgEnvelope = <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>;
const SvgVaccine = <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.5 13.5h3V13H16v-3h-2.5V7.5h-3V10H8v3h2.5v2.5z"/></svg>;
const SvgClipboard = <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>;
const SvgFile = <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>;

/* ─── Document Type Config ─── */
const DOC_TYPES = [
  { value: '', label: 'All Documents', icon: SvgFolder },
  { value: 'prescription', label: 'Prescription', icon: SvgPrescription },
  { value: 'discharge_summary', label: 'Discharge Summary', icon: SvgHospital },
  { value: 'insurance', label: 'Insurance', icon: SvgShield },
  { value: 'referral_letter', label: 'Referral Letter', icon: SvgEnvelope },
  { value: 'vaccination_record', label: 'Vaccination', icon: SvgVaccine },
  { value: 'medical_history', label: 'Medical History', icon: SvgClipboard },
  { value: 'other', label: 'Other', icon: SvgFile },
];

const TYPE_ICON = {
  prescription: SvgPrescription,
  discharge_summary: SvgHospital,
  insurance: SvgShield,
  referral_letter: SvgEnvelope,
  vaccination_record: SvgVaccine,
  medical_history: SvgClipboard,
  other: SvgFile,
};

const TYPE_COLOR = {
  prescription: '#f97316',
  discharge_summary: '#6366f1',
  insurance: '#10b981',
  referral_letter: '#3b82f6',
  vaccination_record: '#ec4899',
  medical_history: '#8b5cf6',
  other: '#6b7280',
};

/* ─── File Type Helpers ─── */
function getFileExtension(url) {
  if (!url) return '';
  const name = url.split('/').pop().split('?')[0];
  return name.split('.').pop().toLowerCase();
}

function isImageFile(url) {
  const ext = getFileExtension(url);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}

/* ─── Main Component ─── */
export default function PatientDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [previewDoc, setPreviewDoc] = useState(null);

  /* Upload form state */
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('other');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  /* ─── Fetch ─── */
  const fetchDocuments = useCallback(async (signal) => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      const res = await api.get('/documents/', { params, ...(signal ? { signal } : {}) });
      setDocuments(getResults(res.data));
    } catch {
      /* aborted or network error */
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDocuments(controller.signal);
    return () => controller.abort();
  }, [fetchDocuments]);

  /* ─── Upload ─── */
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('document_type', uploadType);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDesc);

      await api.post('/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage({ text: 'Document uploaded successfully!', type: 'success' });
      setShowUpload(false);
      resetUploadForm();
      fetchDocuments();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      const detail = err.response?.data?.file?.[0] || 'Upload failed. Please try again.';
      setMessage({ text: detail, type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}/`);
      setMessage({ text: 'Document deleted.', type: 'success' });
      fetchDocuments();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch {
      setMessage({ text: 'Failed to delete document.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadType('other');
    setUploadTitle('');
    setUploadDesc('');
    setDragActive(false);
  };

  /* ─── Drag & Drop ─── */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  /* ─── Helpers ─── */
  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  /* Client-side search */
  const filtered = documents.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.title.toLowerCase().includes(term) ||
      (d.description && d.description.toLowerCase().includes(term)) ||
      (d.document_type_display && d.document_type_display.toLowerCase().includes(term))
    );
  });

  /* Stats */
  const totalSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);
  const typeCount = {};
  documents.forEach((d) => {
    typeCount[d.document_type] = (typeCount[d.document_type] || 0) + 1;
  });

  return (
    <>
      {/* ─── Page Header ─── */}
      <div className="docs-page-header">
        <div>
          <h1 className="docs-page-title">My Documents</h1>
          <p className="docs-page-subtitle">
            Your personal health file vault — prescriptions, insurance, medical history &amp; more
          </p>
        </div>
        <button className="docs-upload-btn" onClick={() => setShowUpload(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
          </svg>
          Upload Document
        </button>
      </div>

      {message.text && (
        <div className={`docs-message ${message.type}`}>{message.text}</div>
      )}

      {/* ─── Info Banner — Lab Results redirect ─── */}
      <div className="docs-info-banner">
        <div className="docs-info-banner-icon">
          <svg viewBox="0 0 24 24" style={{ width: '1.25em', height: '1.25em', fill: 'currentColor' }} aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div className="docs-info-banner-text">
          <strong>Looking for lab or diagnostic results?</strong> X-rays, blood tests, MRIs, and other
          clinical test results are available in your{' '}
          <Link to="/patient/lab-results" className="docs-info-link">Lab Results</Link> page.
        </div>
      </div>

      {/* ─── Stats Bar ─── */}
      <div className="docs-stats-bar">
        <div className="docs-stat">
          <span className="docs-stat-value">{documents.length}</span>
          <span className="docs-stat-label">Total Documents</span>
        </div>
        <div className="docs-stat">
          <span className="docs-stat-value">{formatFileSize(totalSize)}</span>
          <span className="docs-stat-label">Storage Used</span>
        </div>
        <div className="docs-stat">
          <span className="docs-stat-value">{Object.keys(typeCount).length}</span>
          <span className="docs-stat-label">Categories</span>
        </div>
      </div>

      {/* ─── Filters & View Toggle ─── */}
      <div className="docs-toolbar">
        <div className="docs-search-wrap">
          <svg className="docs-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            className="docs-search"
            placeholder="Search documents…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="docs-filters">
          {DOC_TYPES.map((t) => (
            <button
              key={t.value}
              className={`docs-filter-chip ${filterType === t.value ? 'active' : ''}`}
              onClick={() => setFilterType(t.value)}
            >
              <span className="chip-icon">{t.icon}</span>
              {t.label}
              {t.value && typeCount[t.value] ? (
                <span className="chip-count">{typeCount[t.value]}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="docs-view-toggle">
          <button
            className={`docs-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <svg viewBox="0 0 24 24"><path d="M4 11h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v6a1 1 0 001 1zm10 0h6a1 1 0 001-1V4a1 1 0 00-1-1h-6a1 1 0 00-1 1v6a1 1 0 001 1zM4 21h6a1 1 0 001-1v-6a1 1 0 00-1-1H4a1 1 0 00-1 1v6a1 1 0 001 1zm10 0h6a1 1 0 001-1v-6a1 1 0 00-1-1h-6a1 1 0 00-1 1v6a1 1 0 001 1z"/></svg>
          </button>
          <button
            className={`docs-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <svg viewBox="0 0 24 24"><path d="M3 13h18c.6 0 1-.4 1-1s-.4-1-1-1H3c-.6 0-1 .4-1 1s.4 1 1 1zm0-6h18c.6 0 1-.4 1-1s-.4-1-1-1H3c-.6 0-1 .4-1 1s.4 1 1 1zm0 12h18c.6 0 1-.4 1-1s-.4-1-1-1H3c-.6 0-1 .4-1 1s.4 1 1 1z"/></svg>
          </button>
        </div>
      </div>

      {/* ─── Document Grid / List ─── */}
      {loading ? (
        <div className="docs-loading">
          <div className="docs-loading-spinner" />
          <p>Loading documents…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="docs-empty">
          <div className="docs-empty-icon">
            <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', fill: 'currentColor' }} aria-hidden="true">
              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
            </svg>
          </div>
          <h3>No Documents Found</h3>
          {searchTerm || filterType ? (
            <p>Try adjusting your search or filter to find what you&apos;re looking for.</p>
          ) : (
            <p>Upload your first document to get started — prescriptions, insurance cards, referral letters, and more.</p>
          )}
          {!searchTerm && !filterType && (
            <button className="docs-empty-action" onClick={() => setShowUpload(true)}>
              Upload Your First Document
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ─── Grid View ─── */
        <div className="docs-grid">
          {filtered.map((doc) => (
            <div key={doc.id} className="doc-card">
              <div
                className="doc-card-accent"
                style={{ background: TYPE_COLOR[doc.document_type] || '#6b7280' }}
              />
              <div className="doc-card-body">
                <div className="doc-card-header">
                  <span
                    className="doc-type-icon"
                    style={{ background: `${TYPE_COLOR[doc.document_type] || '#6b7280'}15` }}
                  >
                    {TYPE_ICON[doc.document_type] || SvgFile}
                  </span>
                  <span
                    className="doc-type-badge"
                    style={{ color: TYPE_COLOR[doc.document_type] || '#6b7280' }}
                  >
                    {doc.document_type_display}
                  </span>
                </div>
                <h3 className="doc-card-title">{doc.title}</h3>
                {doc.description && (
                  <p className="doc-card-desc">{doc.description}</p>
                )}
                <div className="doc-card-meta">
                  <span><svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg> {formatDate(doc.created_at)}</span>
                  <span><svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg> {formatFileSize(doc.file_size)}</span>
                </div>
                {doc.uploaded_by_name && (
                  <div className="doc-card-uploader">
                    Uploaded by {doc.uploaded_by_name}
                  </div>
                )}
                <div className="doc-card-actions">
                  {doc.file_url && (
                    <>
                      <button
                        className="doc-action-btn primary"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg> View
                      </button>
                      <a
                        href={doc.file_url}
                        download
                        className="doc-action-btn"
                      >
                        <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Download
                      </a>
                    </>
                  )}
                  <button
                    className="doc-action-btn danger"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ─── List View ─── */
        <div className="docs-list">
          <div className="docs-list-header">
            <span className="list-col-name">Document</span>
            <span className="list-col-type">Type</span>
            <span className="list-col-date">Date</span>
            <span className="list-col-size">Size</span>
            <span className="list-col-actions">Actions</span>
          </div>
          {filtered.map((doc) => (
            <div key={doc.id} className="docs-list-row">
              <div className="list-col-name">
                <span
                  className="list-type-dot"
                  style={{ background: TYPE_COLOR[doc.document_type] || '#6b7280' }}
                />
                <div>
                  <div className="list-doc-title">{doc.title}</div>
                  {doc.description && (
                    <div className="list-doc-desc">{doc.description}</div>
                  )}
                </div>
              </div>
              <div className="list-col-type">
                <span className="list-type-tag" style={{ color: TYPE_COLOR[doc.document_type] || '#6b7280', background: `${TYPE_COLOR[doc.document_type] || '#6b7280'}15` }}>
                  {TYPE_ICON[doc.document_type] || SvgFile} {doc.document_type_display}
                </span>
              </div>
              <div className="list-col-date">{formatDate(doc.created_at)}</div>
              <div className="list-col-size">{formatFileSize(doc.file_size)}</div>
              <div className="list-col-actions">
                {doc.file_url && (
                  <>
                    <button
                      className="list-action-btn"
                      onClick={() => setPreviewDoc(doc)}
                      title="View"
                    >
                      <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', fill: 'currentColor' }} aria-hidden="true"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    </button>
                    <a href={doc.file_url} download className="list-action-btn" title="Download">
                      <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', fill: 'currentColor' }} aria-hidden="true"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                    </a>
                  </>
                )}
                <button
                  className="list-action-btn danger"
                  onClick={() => handleDelete(doc.id)}
                  title="Delete"
                >
                  <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', fill: 'currentColor' }} aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Preview Modal ─── */}
      {previewDoc && (
        <div className="docs-modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="docs-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="docs-modal-header">
              <h2 className="docs-modal-title">
                {TYPE_ICON[previewDoc.document_type] || SvgFile} {previewDoc.title}
              </h2>
              <button className="docs-modal-close" onClick={() => setPreviewDoc(null)}>×</button>
            </div>
            <div className="docs-preview-body">
              {isImageFile(previewDoc.file_url) ? (
                <img
                  src={previewDoc.file_url}
                  alt={previewDoc.title}
                  className="docs-preview-image"
                />
              ) : getFileExtension(previewDoc.file_url) === 'pdf' ? (
                <iframe
                  src={previewDoc.file_url}
                  title={previewDoc.title}
                  className="docs-preview-pdf"
                />
              ) : (
                <div className="docs-preview-fallback">
                  <div className="docs-preview-fallback-icon">
                    <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', fill: 'currentColor' }} aria-hidden="true"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                  </div>
                  <p>Preview not available for this file type.</p>
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-action-btn primary"
                  >
                    Open in New Tab
                  </a>
                </div>
              )}
            </div>
            <div className="docs-preview-footer">
              <div className="docs-preview-meta">
                <span>{previewDoc.document_type_display}</span>
                <span>•</span>
                <span>{formatDate(previewDoc.created_at)}</span>
                <span>•</span>
                <span>{formatFileSize(previewDoc.file_size)}</span>
                {previewDoc.uploaded_by_name && (
                  <>
                    <span>•</span>
                    <span>By {previewDoc.uploaded_by_name}</span>
                  </>
                )}
              </div>
              <a
                href={previewDoc.file_url}
                download
                className="doc-action-btn primary"
              >
                <svg viewBox="0 0 24 24" style={I} aria-hidden="true"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── Upload Modal ─── */}
      {showUpload && (
        <div className="docs-modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="docs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="docs-modal-header">
              <h2 className="docs-modal-title">Upload Document</h2>
              <button className="docs-modal-close" onClick={() => { setShowUpload(false); resetUploadForm(); }}>
                ×
              </button>
            </div>
            <div className="docs-modal-body">
              <form onSubmit={handleUpload}>
                {/* Drop zone */}
                <div
                  className={`docs-upload-area ${uploadFile ? 'has-file' : ''} ${dragActive ? 'drag-active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {uploadFile ? (
                    <>
                      <div className="upload-success-icon">
                        <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', fill: '#10b981' }} aria-hidden="true">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <p className="file-name">{uploadFile.name}</p>
                      <p className="file-size-hint">{formatFileSize(uploadFile.size)}</p>
                      <button
                        type="button"
                        className="file-change-btn"
                        onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                      >
                        Change file
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="upload-drop-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                        </svg>
                      </div>
                      <p className="upload-drop-text">
                        {dragActive ? 'Drop your file here!' : 'Drag & drop or click to select'}
                      </p>
                      <p className="upload-drop-hint">PDF, JPG, PNG — Max 10 MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadFile(file);
                        if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
                      }
                    }}
                  />
                </div>

                <div className="docs-form-group">
                  <label className="docs-form-label">Document Type</label>
                  <select
                    className="docs-form-select"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                  >
                    {DOC_TYPES.filter((t) => t.value).map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="docs-form-group">
                  <label className="docs-form-label">Document Name</label>
                  <input
                    className="docs-form-input"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Enter document name"
                    required
                  />
                </div>

                <div className="docs-form-group">
                  <label className="docs-form-label">Description (optional)</label>
                  <textarea
                    className="docs-form-textarea"
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder="Brief description of this document…"
                  />
                </div>

                <button
                  type="submit"
                  className="docs-submit-btn"
                  disabled={!uploadFile || !uploadTitle || uploading}
                >
                  {uploading ? (
                    <>
                      <span className="btn-spinner" /> Uploading…
                    </>
                  ) : (
                    'Upload Document'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
