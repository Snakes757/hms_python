// src/pages/Register.jsx
import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
