import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#E2E3EA',
        fontFamily: "'Poppins', sans-serif",
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '6rem',
          fontWeight: '700',
          color: '#1e3a8a',
          lineHeight: 1,
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: '1.5rem', color: '#333', marginTop: '1rem' }}>
        Page Not Found
      </h1>
      <p style={{ color: '#6b7280', margin: '0.5rem 0 2rem', maxWidth: '400px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        style={{
          padding: '0.8rem 2rem',
          background: '#17a2b8',
          color: 'white',
          borderRadius: '10px',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '0.95rem',
          transition: 'background 0.2s',
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
