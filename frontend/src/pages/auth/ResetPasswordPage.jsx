// src/pages/auth/ResetPasswordPage.jsx
import React from 'react';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm'; // Component from previous batch

const ResetPasswordPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <ResetPasswordForm />
    </div>
  );
};

export default ResetPasswordPage;
