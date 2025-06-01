// src/pages/Login.jsx
import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
