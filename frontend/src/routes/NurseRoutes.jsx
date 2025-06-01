import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import PageWithSidebar from "./PageWithSidebar";

import NurseDashboardPage from "../pages/dashboard/NurseDashboardPage";
import PatientListPage from "../pages/patients/PatientListPage";
import PatientProfilePage from "../pages/patients/PatientProfilePage";
import AppointmentListPage from "../pages/appointments/AppointmentListPage";
import AppointmentDetailsPage from "../pages/appointments/AppointmentDetailsPage";
import MedicalRecordsPage from "../pages/medical/MedicalRecordsPage";
import TreatmentsPage from "../pages/medical/TreatmentsPage";
import ObservationsPage from "../pages/medical/ObservationsPage";
import InquiryListPage from "../pages/inquiries/InquiryListPage";
import InquiryDetailsPageWrapper from "./InquiryDetailsPageWrapper";
import UserProfilePage from "../pages/profile/UserProfilePage";
import ProfileSettingsPage from "../pages/profile/ProfileSettingsPage";

import { USER_ROLES } from "../utils/constants";

const NurseRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<NurseDashboardPage />} />
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
        path="patients/:patientUserId/treatments"
        element={<TreatmentsPage />}
      />
      <Route
        path="patients/:patientUserId/observations"
        element={<ObservationsPage />}
      />

      <Route path="appointments" element={<AppointmentListPage />} />
      <Route
        path="appointments/:appointmentId"
        element={<AppointmentDetailsPage />}
      />

      <Route path="inquiries" element={<InquiryListPage />} />
      <Route
        path="inquiries/:inquiryId"
        element={<InquiryDetailsPageWrapper />}
      />

      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default NurseRoutes;
