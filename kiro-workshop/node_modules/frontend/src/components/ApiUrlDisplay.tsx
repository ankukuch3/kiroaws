import React from 'react';

const ApiUrlDisplay: React.FC = () => {
  // Use environment variable for API URL
  const apiUrl = import.meta.env.VITE_API_URL;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #dee2e6',
      padding: '8px 16px',
      fontSize: '12px',
      color: '#6c757d',
      textAlign: 'center',
      zIndex: 1000
    }}>
      API URL: {apiUrl}
    </div>
  );
};

export default ApiUrlDisplay;
