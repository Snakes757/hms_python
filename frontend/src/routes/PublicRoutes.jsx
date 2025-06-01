// src/routes/PublicRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import InquiryCreatePage from '../pages/inquiries/InquiryCreatePage';
// Potentially a public landing page if HomePage is always protected
// import LandingPage from '../pages/LandingPage'; 

const PublicRoutes = () => {
  return (
    <Routes>
      {/* <Route path="/" element={<LandingPage />} /> // If you have a separate public landing */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} /> 
      <Route path="/contact-us" element={<InquiryCreatePage />} /> {/* Alias for new inquiry */}
      <Route path="/submit-inquiry" element={<InquiryCreatePage />} />
      {/* Add other public routes here, e.g., about page, public service directory */}
    </Routes>
  );
};

export default PublicRoutes;
