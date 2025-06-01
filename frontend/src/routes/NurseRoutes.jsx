import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// import ProtectedRoute from '../components/common/ProtectedRoute'; // Role check handled by parent in AppRoutes
// import RoleBasedRoute from '../components/common/RoleBasedRoute'; // Role check handled by parent in AppRoutes
import PageWithSidebar from "./PageWithSidebar";

// Import Nurse-specific pages and components
import NurseDashboardPage from "../pages/dashboard/NurseDashboardPage";
import PatientListPage from "../pages/patients/PatientListPage"; // Nurses can view patient lists
import PatientProfilePage from "../pages/patients/PatientProfilePage"; // Nurses can view patient profiles
import AppointmentListPage from "../pages/appointments/AppointmentListPage"; // Nurses view appointments
// Nurses might not directly create/edit appointments but can view and assist.
// Specific appointment actions for nurses would be handled by permissions within those pages.
import AppointmentDetailsPage from "../pages/appointments/AppointmentDetailsPage";

// Medical record components that Nurses interact with
import MedicalRecordsPage from "../pages/medical/MedicalRecordsPage"; // For viewing and potentially adding notes/observations
import TreatmentsPage from "../pages/medical/TreatmentsPage"; // Nurses administer treatments
import ObservationsPage from "../pages/medical/ObservationsPage"; // Nurses log observations

import InquiryListPage from "../pages/inquiries/InquiryListPage"; // Nurses can handle inquiries
import InquiryDetailsPageWrapper from "./InquiryDetailsPageWrapper";

import { USER_ROLES } from "../utils/constants";

/**
 * @file NurseRoutes.jsx
 * @description Defines routes accessible only to users with the NURSE role.
 * Assumes parent route in AppRoutes.jsx handles the primary role-based protection.
 */
const NurseRoutes = () => {
  // The primary RoleBasedRoute for NURSE is expected in AppRoutes.jsx, e.g., /nurse/*
  // These routes are nested within that.
  return (
    <Routes>
      <Route path="dashboard" element={<NurseDashboardPage />} />
      {/* Patient Interaction */}
      <Route path="patients" element={<PatientListPage />} />
      <Route path="patients/:userId" element={<PatientProfilePage />} />
      {/* Medical Record Access & Input */}
      {/* Nurses typically view records and add observations/treatments */}
      <Route
        path="patients/:patientUserId/medical-records"
        element={<MedicalRecordsPage />}
      />
      <Route
        path="patients/:patientUserId/treatments"
        element={<TreatmentsPage />}
      />
      <Route
        path="patients/:patientUserId/observations"
        element={<ObservationsPage />}
      />
      {/* Appointment Viewing */}
      <Route path="appointments" element={<AppointmentListPage />} />{" "}
      {/* Shows relevant appointments */}
      <Route
        path="appointments/:appointmentId"
        element={<AppointmentDetailsPage />}
      />
      {/* Inquiry Handling */}
      <Route path="inquiries" element={<InquiryListPage />} />
      <Route
        path="inquiries/:inquiryId"
        element={<InquiryDetailsPageWrapper />}
      />
      {/* Nurses can view and update inquiries assigned to them or generally */}
      {/* Fallback for any other nurse-specific path, redirect to nurse dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default NurseRoutes;
