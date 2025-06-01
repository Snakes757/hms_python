// src/pages/auth/ForgotPasswordPage.jsx
import React from 'react';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

const ForgotPasswordPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <ForgotPasswordForm />
    </div>
  );
};

export default ForgotPasswordPage;
