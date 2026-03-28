import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getResults } from '../../services/api';
import '../../styles/doctor-pending-reports.css';

export default function DoctorPendingReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPendingReports = useCallback(async () => {
    try {
      setError('');
      // Fetch lab tests with status that need doctor review
      const res = await api.get('/lab-tests/', { 
        params: { status: 'results_available' } 
      });
      setReports(getResults(res.data));
    } catch (err) {
      setError('Failed to load pending reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingReports();
  }, [fetchPendingReports]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityClass = (priority) => {
    const classMap = {
      routine: 'priority-routine',
      urgent: 'priority-urgent',
      stat: 'priority-stat',
    };
    return classMap[priority] || 'priority-routine';
  };

  const handleReviewReport = (reportId, patientId) => {
    // Navigate to patient detail with a tab/section focused on lab results
    navigate(`/doctor/patients/${patientId}`, { state: { tab: 'lab-results' } });
  };

  if (loading) {
    return (
      <div className="pending-reports-loading">
        <div className="doc-spinner" />
        <p>Loading pending reports...</p>
      </div>
    );
  }

  return (
    <div className="pending-reports-container">
      <div className="pending-reports-header">
        <h1>Pending Lab Reports</h1>
        <p className="pending-reports-subtitle">
          {reports.length} report{reports.length !== 1 ? 's' : ''} awaiting your review
        </p>
      </div>

      {error && (
        <div className="pending-reports-error">
          <p>{error}</p>
          <button onClick={fetchPendingReports} className="btn-retry">
            Try Again
          </button>
        </div>
      )}

      {reports.length === 0 && !error && (
        <div className="pending-reports-empty">
          <svg viewBox="0 0 24 24" className="empty-icon">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.12-2.59c-.38-.48-.98-.74-1.63-.74-.97 0-1.91.46-2.5 1.23-.35.45-.84 1.38-.84 2.03 0 .79.39 1.54 1.03 1.99.35.26.78.41 1.26.41.97 0 1.91-.46 2.5-1.23l3.5-4.46 3.5 4.46c.59.77 1.53 1.23 2.5 1.23.48 0 .91-.15 1.26-.41.64-.45 1.03-1.2 1.03-1.99 0-.65-.49-1.58-.84-2.03-.59-.76-1.53-1.23-2.5-1.23-.65 0-1.25.26-1.63.74z" />
          </svg>
          <h3>No Pending Reports</h3>
          <p>All lab results have been reviewed. Great job staying on top of things!</p>
        </div>
      )}

      {reports.length > 0 && !error && (
        <div className="pending-reports-list">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <div className="report-patient-info">
                  <h3>{report.patient_name}</h3>
                  <p className="report-test-name">{report.test_name}</p>
                </div>
                <div className={`report-priority ${getPriorityClass(report.priority)}`}>
                  {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                </div>
              </div>

              <div className="report-meta">
                <div className="meta-item">
                  <label>Test Category:</label>
                  <span>{report.test_category}</span>
                </div>
                <div className="meta-item">
                  <label>Ordered:</label>
                  <span>
                    {formatDate(report.ordered_at)} at {formatTime(report.ordered_at)}
                  </span>
                </div>
                <div className="meta-item">
                  <label>Completed:</label>
                  <span>
                    {report.completed_at
                      ? `${formatDate(report.completed_at)} at ${formatTime(report.completed_at)}`
                      : 'Pending'}
                  </span>
                </div>
              </div>

              {report.clinical_notes && (
                <div className="report-notes">
                  <label>Clinical Notes:</label>
                  <p>{report.clinical_notes}</p>
                </div>
              )}

              <div className="report-actions">
                <button
                  className="btn-review"
                  onClick={() => handleReviewReport(report.id, report.patient)}
                >
                  Review Report
                </button>
                <button
                  className="btn-patient"
                  onClick={() => navigate(`/doctor/patients/${report.patient}`)}
                >
                  View Patient
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
