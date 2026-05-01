import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.toString() || 'Unknown error';
      const stack = this.state.errorInfo?.componentStack || '';

      return (
        <div style={{ 
          minHeight: '100vh', 
          width: '100vw', 
          background: '#050505', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'flex-start', 
          color: '#fff',
          padding: '30px 20px',
          textAlign: 'center',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          <FiAlertTriangle size={60} color="#ff5733" style={{ marginBottom: '20px', marginTop: '20px' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-1px', marginBottom: '15px' }}>SYSTEM ANOMALY DETECTED</h1>

          {/* Show real error for debugging - REMOVE after fix */}
          <div style={{
            background: '#111',
            border: '1px solid #ff5733',
            borderRadius: '12px',
            padding: '15px',
            width: '100%',
            maxWidth: '600px',
            textAlign: 'left',
            marginBottom: '20px',
            wordBreak: 'break-all',
            fontSize: '0.75rem',
            lineHeight: '1.6',
          }}>
            <p style={{ color: '#ff5733', fontWeight: '700', marginBottom: '8px' }}>Error:</p>
            <p style={{ color: '#ffaa88', marginBottom: '12px' }}>{errMsg}</p>
            <p style={{ color: '#ff5733', fontWeight: '700', marginBottom: '8px' }}>Component Stack:</p>
            <pre style={{ color: '#888', whiteSpace: 'pre-wrap', fontSize: '0.65rem', margin: 0 }}>{stack.slice(0, 800)}</pre>
          </div>

          <button 
            onClick={() => window.location.reload()}
            style={{ 
              background: '#ff5733', 
              color: '#fff', 
              border: 'none', 
              padding: '15px 35px', 
              borderRadius: '20px', 
              fontWeight: '700', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '1rem'
            }}
          >
            <FiRefreshCw /> REBOOT INTERFACE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
