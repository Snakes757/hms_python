import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Register";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import InquiryCreatePage from "../pages/inquiries/InquiryCreatePage";
import HomePage from "../pages/Home"; // Public landing/welcome

const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} /> {}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/reset-password/:uid/:token"
        element={<ResetPasswordPage />}
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} /> {}
      <Route path="/contact-us" element={<InquiryCreatePage />} />
      <Route path="/submit-inquiry" element={<InquiryCreatePage />} />
      <Route path="*" element={<Navigate to="/" replace />} /> {}
    </Routes>
  );
};

export default PublicRoutes;
