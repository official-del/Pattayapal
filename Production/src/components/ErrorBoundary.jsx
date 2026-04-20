import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', 
          width: '100vw', 
          background: '#050505', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#fff',
          padding: '20px',
          textAlign: 'center'
        }}>
          <FiAlertTriangle size={80} color="var(--accent)" style={{ marginBottom: '30px' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-1px', marginBottom: '15px' }}>SYSTEM ANOMALY DETECTED</h1>
          <p style={{ color: '#666', maxWidth: '500px', lineHeight: '1.6', marginBottom: '40px' }}>
            The application encountered an unexpected runtime error. Your session data is safe, but we need to reset the interface.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              background: 'var(--accent)', 
              color: '#fff', 
              border: 'none', 
              padding: '18px 40px', 
              borderRadius: '20px', 
              fontWeight: '700', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
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
