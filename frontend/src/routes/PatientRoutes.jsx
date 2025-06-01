import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import PageWithSidebar from "./PageWithSidebar";

import PatientDashboardPage from "../pages/dashboard/PatientDashboardPage";
import PatientProfilePage from "../pages/patients/PatientProfilePage";
import AppointmentListPage from "../pages/appointments/AppointmentListPage";
import AppointmentCreatePage from "../pages/appointments/AppointmentCreatePage";
import AppointmentDetailsPage from "../pages/appointments/AppointmentDetailsPage";
import InvoiceListPage from "../pages/billing/InvoiceListPage";
import InvoiceDetailsPage from "../pages/billing/InvoiceDetailsPage";
import TelemedicineListPage from "../pages/telemedicine/TelemedicineListPage";
import TelemedicineCreatePage from "../pages/telemedicine/TelemedicineCreatePage";
import TelemedicineSessionPage from "../pages/telemedicine/TelemedicineSessionPage";
import TelemedicineEditPage from "../pages/telemedicine/TelemedicineEditPage";
import InquiryListPage from "../pages/inquiries/InquiryListPage";
import InquiryCreatePage from "../pages/inquiries/InquiryCreatePage";
import InquiryDetailsPageWrapper from "./InquiryDetailsPageWrapper";
import UserProfilePage from "../pages/profile/UserProfilePage";
import ProfileSettingsPage from "../pages/profile/ProfileSettingsPage";
import MedicalRecordsPage from "../pages/medical/MedicalRecordsPage";
import PrescriptionsPage from "../pages/medical/PrescriptionsPage";
import TreatmentsPage from "../pages/medical/TreatmentsPage";
import ObservationsPage from "../pages/medical/ObservationsPage";

import { USER_ROLES } from "../utils/constants";

const PatientRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<PatientDashboardPage />} />
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

      <Route path="medical-info/:userId" element={<PatientProfilePage />} />
      <Route
        path="medical-records/:patientUserId/general"
        element={<MedicalRecordsPage section="general" />}
      />
      <Route
        path="medical-records/:patientUserId/prescriptions"
        element={<PrescriptionsPage />}
      />
      <Route
        path="medical-records/:patientUserId/treatments"
        element={<TreatmentsPage />}
      />
      <Route
        path="medical-records/:patientUserId/observations"
        element={<ObservationsPage />}
      />

      <Route path="appointments" element={<AppointmentListPage />} />
      <Route path="appointments/new" element={<AppointmentCreatePage />} />
      <Route
        path="appointments/:appointmentId"
        element={<AppointmentDetailsPage />}
      />

      <Route path="invoices" element={<InvoiceListPage />} />
      <Route path="invoices/:invoiceId" element={<InvoiceDetailsPage />} />

      <Route path="telemedicine/sessions" element={<TelemedicineListPage />} />
      <Route
        path="telemedicine/sessions/new"
        element={<TelemedicineCreatePage />}
      />
      <Route
        path="telemedicine/sessions/:sessionId"
        element={<TelemedicineSessionPage />}
      />
      <Route
        path="telemedicine/sessions/:sessionId/edit"
        element={<TelemedicineEditPage />}
      />

      <Route path="inquiries" element={<InquiryListPage />} />
      <Route path="inquiries/new" element={<InquiryCreatePage />} />
      <Route
        path="inquiries/:inquiryId"
        element={<InquiryDetailsPageWrapper />}
      />

      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default PatientRoutes;
