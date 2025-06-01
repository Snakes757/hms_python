import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute"; // Assuming this correctly handles role checks or is used in conjunction with RoleBasedRoute
import RoleBasedRoute from "../components/common/RoleBasedRoute";
import PageWithSidebar from "./PageWithSidebar";

// Import Doctor-specific pages and components
import DoctorDashboardPage from "../pages/dashboard/DoctorDashboardPage";
import PatientListPage from "../pages/patients/PatientListPage"; // Doctors can view patient lists
import PatientProfilePage from "../pages/patients/PatientProfilePage"; // Doctors can view patient profiles
import AppointmentListPage from "../pages/appointments/AppointmentListPage"; // Doctors manage their appointments
import AppointmentCreatePage from "../pages/appointments/AppointmentCreatePage";
import AppointmentDetailsPage from "../pages/appointments/AppointmentDetailsPage";
import AppointmentEditPage from "../pages/appointments/AppointmentEditPage";
import TelemedicineListPage from "../pages/telemedicine/TelemedicineListPage";
import TelemedicineCreatePage from "../pages/telemedicine/TelemedicineCreatePage";
import TelemedicineSessionPage from "../pages/telemedicine/TelemedicineSessionPage";
import TelemedicineEditPage from "../pages/telemedicine/TelemedicineEditPage";
import MedicalRecordsPage from "../pages/medical/MedicalRecordsPage";
import PrescriptionsPage from "../pages/medical/PrescriptionsPage";
import TreatmentsPage from "../pages/medical/TreatmentsPage";
import ObservationsPage from "../pages/medical/ObservationsPage";
// Potentially a specific "My Schedule" page if different from general appointment list
// import DoctorSchedulePage from '../pages/doctor/DoctorSchedulePage';

import { USER_ROLES } from "../utils/constants";

/**
 * @file DoctorRoutes.jsx
 * @description Defines routes accessible only to users with the DOCTOR role.
 * All routes are wrapped with RoleBasedRoute to ensure role-based access.
 */
const DoctorRoutes = () => {
  // All routes within this component are already protected by an upstream RoleBasedRoute
  // that ensures the user has the DOCTOR role.
  // So, individual ProtectedRoute here for role might be redundant if parent handles it.
  // However, it's good for clarity or if these routes are ever used outside that parent context.

  return (
    <Routes>
      <Route path="dashboard" element={<DoctorDashboardPage />} />
      {/* Patient Management */}
      <Route path="patients" element={<PatientListPage />} />
      <Route path="patients/:userId" element={<PatientProfilePage />} />
      {/* Medical Records Management for a specific patient */}
      {/* These might be better accessed via the PatientProfilePage, but direct links can be useful */}
      <Route
        path="patients/:patientUserId/medical-records"
        element={<MedicalRecordsPage />}
      />
      <Route
        path="patients/:patientUserId/prescriptions"
        element={<PrescriptionsPage />}
      />
      <Route
        path="patients/:patientUserId/treatments"
        element={<TreatmentsPage />}
      />
      <Route
        path="patients/:patientUserId/observations"
        element={<ObservationsPage />}
      />
      {/* Appointment Management */}
      <Route path="appointments" element={<AppointmentListPage />} />{" "}
      {/* Shows doctor's appointments by default */}
      <Route path="appointments/new" element={<AppointmentCreatePage />} />
      <Route
        path="appointments/:appointmentId"
        element={<AppointmentDetailsPage />}
      />
      <Route
        path="appointments/:appointmentId/edit"
        element={<AppointmentEditPage />}
      />
      {/* <Route path="schedule" element={<DoctorSchedulePage />} /> */}
      {/* Telemedicine Management */}
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
      {/* Fallback for any other doctor-specific path, redirect to doctor dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default DoctorRoutes;
