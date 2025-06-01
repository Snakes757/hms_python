import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import PageWithSidebar from "./PageWithSidebar";

import DoctorDashboardPage from "../pages/dashboard/DoctorDashboardPage";
import PatientListPage from "../pages/patients/PatientListPage";
import PatientProfilePage from "../pages/patients/PatientProfilePage";
import AppointmentListPage from "../pages/appointments/AppointmentListPage";
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
import UserProfilePage from "../pages/profile/UserProfilePage";
import ProfileSettingsPage from "../pages/profile/ProfileSettingsPage";

import { USER_ROLES } from "../utils/constants";

const DoctorRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<DoctorDashboardPage />} />
      <Route
        path="profile/me"
        element={
          <PageWithSidebar title="My Profile">
            <UserProfilePage />
          </PageWithSidebar>
        }
      />
      <Route
        path="profile/settings"
        element={
          <PageWithSidebar title="Settings">
            <ProfileSettingsPage />
          </PageWithSidebar>
        }
      />

      <Route path="patients" element={<PatientListPage />} />
      <Route path="patients/:userId" element={<PatientProfilePage />} />

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

      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default DoctorRoutes;
