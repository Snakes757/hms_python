// src/routes/PatientRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PatientDashboardPage from '../pages/dashboard/PatientDashboardPage';
import PatientProfilePage from '../pages/patients/PatientProfilePage';
import AppointmentListPage from '../pages/appointments/AppointmentListPage';
import AppointmentCreatePage from '../pages/appointments/AppointmentCreatePage';
import AppointmentDetailsPage from '../pages/appointments/AppointmentDetailsPage';
import InvoiceListPage from '../pages/billing/InvoiceListPage';
import InvoiceDetailsPage from '../pages/billing/InvoiceDetailsPage';
import TelemedicineListPage from '../pages/telemedicine/TelemedicineListPage';
import TelemedicineSessionPage from '../pages/telemedicine/TelemedicineSessionPage';
import TelemedicineForm from '../components/telemedicine/TelemedicineForm';
import InquiryListPage from '../pages/inquiries/InquiryListPage';
import InquiryCreatePage from '../pages/inquiries/InquiryCreatePage';
import InquiryDetailsPageWrapper from './InquiryDetailsPageWrapper'; // Using the wrapper
import ProfileSettingsPage from '../pages/profile/ProfileSettingsPage';
import UserProfilePage from '../pages/profile/UserProfilePage';
import PageWithSidebar from './PageWithSidebar';


const PatientRoutes = () => {
  // These routes are intended to be nested under a path that's already protected for PATIENT role
  // e.g., in AppRoutes.jsx: <Route path="/*" element={<ProtectedRoute requiredRole="PATIENT"><PatientRoutes /></ProtectedRoute>} />
  // The dashboard is the primary entry point.
  return (
    <Routes>
      <Route path="dashboard" element={<PatientDashboardPage />} />
      
      {/* Profile & Settings */}
      <Route path="my-profile" element={<PageWithSidebar title="My Profile"><UserProfilePage /></PageWithSidebar>} />
      <Route path="settings" element={<PageWithSidebar title="Settings"><ProfileSettingsPage /></PageWithSidebar>} />

      {/* Medical Information (links to their own profile essentially) */}
      <Route path="my-medical-info/:userId" element={<PatientProfilePage />} />


      {/* Appointments */}
      <Route path="appointments" element={<AppointmentListPage />} />
      <Route path="appointments/new" element={<AppointmentCreatePage />} />
      <Route path="appointments/:appointmentId" element={<AppointmentDetailsPage />} />

      {/* Billing */}
      <Route path="invoices" element={<InvoiceListPage />} />
      <Route path="invoices/:invoiceId" element={<InvoiceDetailsPage />} />

      {/* Telemedicine */}
      <Route path="telemedicine/sessions" element={<TelemedicineListPage />} />
      <Route path="telemedicine/sessions/new" element={<PageWithSidebar title="Schedule Telemedicine"><TelemedicineForm /></PageWithSidebar>} />
      <Route path="telemedicine/sessions/:sessionId" element={<TelemedicineSessionPage />} />

      {/* Inquiries */}
      <Route path="inquiries" element={<InquiryListPage />} />
      <Route path="inquiries/new" element={<PageWithSidebar title="Submit New Inquiry"><InquiryCreatePage /></PageWithSidebar>} />
      <Route path="inquiries/:inquiryId" element={<InquiryDetailsPageWrapper />} />
      
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default PatientRoutes;
