// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import HomePage from '../pages/Home';
import UserProfilePage from '../pages/profile/UserProfilePage';
import PatientListPage from '../pages/patients/PatientListPage';
import PatientProfilePage from '../pages/patients/PatientProfilePage'; // New
import ProtectedRoute from '../components/common/ProtectedRoute'; 

// Define roles (could be imported from a constants file)
const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  RECEPTIONIST: 'RECEPTIONIST',
  PATIENT: 'PATIENT',
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Authenticated Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } 
      />
      <Route path="/home" element={<Navigate replace to="/" />} />

      <Route 
        path="/profile/me" 
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        } 
      />

      {/* Patient Routes */}
      <Route 
        path="/patients" 
        element={
          <ProtectedRoute requiredRole={[ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN, ROLES.RECEPTIONIST]}>
            <PatientListPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/patients/:userId" 
        element={
          // This route needs to be accessible by staff to view any patient,
          // and by a patient to view their own profile.
          // ProtectedRoute logic might need to be more complex or handled inside PatientProfilePage.
          // For now, a general authenticated check. Specific logic inside the page.
          <ProtectedRoute> 
            <PatientProfilePage />
          </ProtectedRoute>
        } 
      />
      
      {/* Further routes to be added:
        - Appointments
        - Medical Management (Prescriptions, Treatments, Observations)
        - Billing
        - Telemedicine
        - Inquiries
        - Admin specific routes (User Management, Reports)
      */}

      {/* Fallback for unmatched routes */}
      <Route path="*" element={
        <div className="container text-center mt-5">
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
          <Link to="/" className="btn btn-primary">Go to Homepage</Link>
        </div>
      } />
    </Routes>
  );
};

export default AppRoutes;
