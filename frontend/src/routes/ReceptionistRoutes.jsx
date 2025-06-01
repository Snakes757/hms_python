import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// import ProtectedRoute from '../components/common/ProtectedRoute'; // Role check handled by parent in AppRoutes
// import RoleBasedRoute from '../components/common/RoleBasedRoute'; // Role check handled by parent in AppRoutes
import PageWithSidebar from "./PageWithSidebar";

// Import Receptionist-specific pages and components
import ReceptionistDashboardPage from "../pages/dashboard/ReceptionistDashboardPage";
import PatientListPage from "../pages/patients/PatientListPage"; // Receptionists can view patient lists
import PatientProfilePage from "../pages/patients/PatientProfilePage"; // Receptionists can view patient profiles
// Receptionists can register new patients (link to public /register, or a specific staff registration form)
import RegisterPage from "../pages/Register"; // Or a dedicated StaffPatientRegistrationPage

// Appointment Management (Full CRUD for Receptionists)
import AppointmentListPage from "../pages/appointments/AppointmentListPage";
import AppointmentCreatePage from "../pages/appointments/AppointmentCreatePage";
import AppointmentDetailsPage from "../pages/appointments/AppointmentDetailsPage";
import AppointmentEditPage from "../pages/appointments/AppointmentEditPage";

// Billing Management
import BillingDashboardPage from "../pages/dashboard/BillingDashboardPage";
import InvoiceListPage from "../pages/billing/InvoiceListPage";
import InvoiceCreatePage from "../pages/billing/InvoiceCreatePage";
import InvoiceDetailsPage from "../pages/billing/InvoiceDetailsPage";
import InvoiceEditPage from "../pages/billing/InvoiceEditPage";
import PaymentPage from "../pages/billing/PaymentPage"; // For recording payments

// Inquiry Management
import InquiryListPage from "../pages/inquiries/InquiryListPage";
import InquiryCreatePage from "../pages/inquiries/InquiryCreatePage"; // Can log inquiries
import InquiryDetailsPageWrapper from "./InquiryDetailsPageWrapper";

// Telemedicine Scheduling
import TelemedicineListPage from "../pages/telemedicine/TelemedicineListPage";
import TelemedicineCreatePage from "../pages/telemedicine/TelemedicineCreatePage";
import TelemedicineSessionPage from "../pages/telemedicine/TelemedicineSessionPage";
import TelemedicineEditPage from "../pages/telemedicine/TelemedicineEditPage";

import { USER_ROLES } from "../utils/constants";

/**
 * @file ReceptionistRoutes.jsx
 * @description Defines routes accessible only to users with the RECEPTIONIST role.
 * Assumes parent route in AppRoutes.jsx handles the primary role-based protection.
 */
const ReceptionistRoutes = () => {
  // The primary RoleBasedRoute for RECEPTIONIST is expected in AppRoutes.jsx, e.g., /receptionist/*
  // These routes are nested within that.
  return (
    <Routes>
      <Route path="dashboard" element={<ReceptionistDashboardPage />} />
      {/* Patient Management */}
      <Route path="patients" element={<PatientListPage />} />
      <Route path="patients/:userId" element={<PatientProfilePage />} />
      {/* The main /register route is public. If there's a specific staff-initiated registration, it might be a different component or context. */}
      {/* For now, linking to the general register page, assuming it handles context or redirects. */}
      <Route path="patient-registration" element={<RegisterPage />} />
      {/* Appointment Scheduling (Full Management) */}
      <Route path="appointments" element={<AppointmentListPage />} />
      <Route path="appointments/new" element={<AppointmentCreatePage />} />
      <Route
        path="appointments/:appointmentId"
        element={<AppointmentDetailsPage />}
      />
      <Route
        path="appointments/:appointmentId/edit"
        element={<AppointmentEditPage />}
      />
      {/* Billing Management */}
      <Route path="billing" element={<BillingDashboardPage />} />{" "}
      {/* Shortcut to billing dashboard */}
      <Route path="billing/invoices" element={<InvoiceListPage />} />
      <Route path="billing/invoices/new" element={<InvoiceCreatePage />} />
      <Route
        path="billing/invoices/:invoiceId"
        element={<InvoiceDetailsPage />}
      />
      <Route
        path="billing/invoices/:invoiceId/edit"
        element={<InvoiceEditPage />}
      />
      <Route path="billing/payments/record" element={<PaymentPage />} />
      {/* Inquiry Management */}
      <Route path="inquiries" element={<InquiryListPage />} />
      <Route path="inquiries/new" element={<InquiryCreatePage />} />{" "}
      {/* Receptionists can log new inquiries */}
      <Route
        path="inquiries/:inquiryId"
        element={<InquiryDetailsPageWrapper />}
      />
      {/* Telemedicine Scheduling */}
      <Route path="telemedicine" element={<TelemedicineListPage />} />
      <Route path="telemedicine/new" element={<TelemedicineCreatePage />} />
      <Route
        path="telemedicine/:sessionId"
        element={<TelemedicineSessionPage />}
      />
      <Route
        path="telemedicine/:sessionId/edit"
        element={<TelemedicineEditPage />}
      />
      {/* Fallback for any other receptionist-specific path, redirect to receptionist dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default ReceptionistRoutes;
