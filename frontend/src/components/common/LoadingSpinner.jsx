// src/components/common/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '200px' }}>
      <div className="spinner-border text-primary mb-2" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">{message}</span>
      </div>
      <p className="text-muted">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
