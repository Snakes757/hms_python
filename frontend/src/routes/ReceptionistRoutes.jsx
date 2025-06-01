// src/routes/ReceptionistRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PageWithSidebar from './PageWithSidebar';

// Receptionist Specific Pages/Components
import ReceptionistDashboardPage from '../pages/dashboard/ReceptionistDashboardPage';
// Patient List/Search (general /patients route)
// Appointment Scheduling (general /appointments/new and /appointments routes)
// Inquiry Management (general /inquiries route)
// Billing (general /billing/invoices routes)

const ROLES = { RECEPTIONIST: 'RECEPTIONIST' };

const ReceptionistRoutes = () => {
  // Nested under a path protected for RECEPTIONIST role.
  return (
    <Routes>
      <Route path="dashboard" element={<ReceptionistDashboardPage />} />
      {/* ReceptionistDashboardPage includes Sidebar */}

      {/* Most functionalities for receptionists (patient search, appointment scheduling,
          inquiry logging, invoice creation) are typically accessed via the main shared routes
          like /patients, /appointments, /inquiries, /billing/invoices.
          The components themselves will show relevant actions based on the RECEPTIONIST role.
          This file is for any truly distinct sections only accessible via a /receptionist/* path.
      */}
      
      {/* Example: A dedicated patient registration form if different from public one */}
      {/* <Route path="register-patient" element={<PageWithSidebar title="Register New Patient"><InternalPatientRegistrationForm /></PageWithSidebar>} /> */}

      {/* Catch-all for /receptionist/*, redirect to receptionist dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default ReceptionistRoutes;
