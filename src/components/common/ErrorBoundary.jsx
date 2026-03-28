import { Component } from 'react';

/**
 * H-4: React Error Boundary — catches unhandled errors in child components
 * and shows a recovery UI instead of a blank white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: "'Poppins', sans-serif",
          padding: '2rem',
          textAlign: 'center',
          background: '#f5f7fa',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '3rem',
            maxWidth: '480px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f59e0b', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" style={{ width: '1em', height: '1em', fill: 'currentColor' }} aria-hidden="true">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', color: '#1e3a8a', marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#1e3a8a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#1e3a8a',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
