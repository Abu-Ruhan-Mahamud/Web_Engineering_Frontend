import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/doctor-patients.css';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/doctor/patients/')
      .then((res) => setPatients(res.data))
      .catch(() => { /* silently handle */ })
      .finally(() => setLoading(false));
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filtered = patients.filter((p) => {
    const fullName = `${p.first_name} ${p.last_name}`;
    return fullName.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="doc-loading">
        <div className="doc-spinner" />
      </div>
    );
  }

  return (
    <div className="doc-patients-page">
      <div className="doc-patients-header">
        <h1>My Patients</h1>
        <div className="doc-search-box">
          <svg viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="doc-empty-state">
          {search ? 'No patients match your search.' : 'No patients found.'}
        </div>
      ) : (
        <div className="doc-patients-grid">
          {filtered.map((pt) => (
            <Link
              key={pt.id}
              to={`/doctor/patients/${pt.id}`}
              className="doc-patient-card"
            >
              <div className="doc-pc-avatar">{getInitials(`${pt.first_name} ${pt.last_name}`)}</div>
              <div className="doc-pc-info">
                <div className="doc-pc-name">{pt.first_name} {pt.last_name}</div>
                <div className="doc-pc-sub">
                  Last visit: {pt.last_visit || 'N/A'}
                </div>
              </div>
              <svg className="doc-pc-arrow" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
