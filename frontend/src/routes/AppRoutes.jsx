import React, { useContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ProtectedRoute from "../components/common/ProtectedRoute";
import RoleBasedRoute from "../components/common/RoleBasedRoute";
import PageWithSidebar from "./PageWithSidebar";

import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Register";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import HomePage from "../pages/Home";
import UserProfilePage from "../pages/profile/UserProfilePage";
import ProfileSettingsPage from "../pages/profile/ProfileSettingsPage";

import PatientListPage from "../pages/patients/PatientListPage";
import PatientProfilePage from "../pages/patients/PatientProfilePage";

import MedicalRecordsPage from "../pages/medical/MedicalRecordsPage";
import PrescriptionsPage from "../pages/medical/PrescriptionsPage";
import TreatmentsPage from "../pages/medical/TreatmentsPage";
import ObservationsPage from "../pages/medical/ObservationsPage";

import AppointmentListPage from "../pages/appointments/AppointmentListPage";
import AppointmentCreatePage from "../pages/appointments/AppointmentCreatePage";
import AppointmentDetailsPage from "../pages/appointments/AppointmentDetailsPage";
import AppointmentEditPage from "../pages/appointments/AppointmentEditPage";

import InvoiceListPage from "../pages/billing/InvoiceListPage";
import InvoiceCreatePage from "../pages/billing/InvoiceCreatePage";
import InvoiceDetailsPage from "../pages/billing/InvoiceDetailsPage";
import InvoiceEditPage from "../pages/billing/InvoiceEditPage";
import PaymentPage from "../pages/billing/PaymentPage";
import BillingDashboardPage from "../pages/dashboard/BillingDashboardPage";

import TelemedicineListPage from "../pages/telemedicine/TelemedicineListPage";
import TelemedicineSessionPage from "../pages/telemedicine/TelemedicineSessionPage";
import TelemedicineCreatePage from "../pages/telemedicine/TelemedicineCreatePage";
import TelemedicineEditPage from "../pages/telemedicine/TelemedicineEditPage";

import InquiryListPage from "../pages/inquiries/InquiryListPage";
import InquiryCreatePage from "../pages/inquiries/InquiryCreatePage";
import InquiryDetailsPageWrapper from "./InquiryDetailsPageWrapper";

import AdminRoutes from "./AdminRoutes";
import DoctorRoutes from "./DoctorRoutes";
import NurseRoutes from "./NurseRoutes";
import ReceptionistRoutes from "./ReceptionistRoutes";
import PatientRoutes from "./PatientRoutes";

import NotFoundPage from "../pages/NotFound";
import UnauthorizedPage from "../pages/Unauthorized";

import { USER_ROLES } from "../utils/constants";

const AppRoutes = () => {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Publicly Accessible Routes */}
      <Route
        path="/login"
        element={!token ? <LoginPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/register"
        element={!token ? <RegisterPage /> : <Navigate to="/" replace />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/reset-password/:uid/:token"
        element={<ResetPasswordPage />}
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/contact-us" element={<InquiryCreatePage />} />
      <Route path="/submit-inquiry" element={<InquiryCreatePage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Authenticated Routes - Entry Point */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="/home" element={<Navigate replace to="/" />} />

      {/* Role-Specific Nested Routes */}
      <Route
        path="/admin/*"
        element={
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <AdminRoutes />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/doctor/*"
        element={
          <RoleBasedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
            <DoctorRoutes />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/nurse/*"
        element={
          <RoleBasedRoute allowedRoles={[USER_ROLES.NURSE]}>
            <NurseRoutes />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/receptionist/*"
        element={
          <RoleBasedRoute allowedRoles={[USER_ROLES.RECEPTIONIST]}>
            <ReceptionistRoutes />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/patient/*"
        element={
          <RoleBasedRoute allowedRoles={[USER_ROLES.PATIENT]}>
            <PatientRoutes />
          </RoleBasedRoute>
        }
      />

      {/* Common Authenticated Routes (accessible by multiple roles if not covered by specific role/* paths) */}
      {/* These should ideally be part of the role-specific routes or handled by HomePage logic */}
      <Route
        path="/profile/me"
        element={
          <ProtectedRoute>
            <PageWithSidebar title="My Profile">
              <UserProfilePage />
            </PageWithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/settings"
        element={
          <ProtectedRoute>
            <PageWithSidebar title="Profile Settings">
              <ProfileSettingsPage />
            </PageWithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <RoleBasedRoute
            allowedRoles={[
              USER_ROLES.ADMIN,
              USER_ROLES.DOCTOR,
              USER_ROLES.NURSE,
              USER_ROLES.RECEPTIONIST,
            ]}
          >
            <PageWithSidebar title="Patient List">
              <PatientListPage />
            </PageWithSidebar>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/patients/:userId"
        element={
          <ProtectedRoute>
            {" "}
            {}
            <PageWithSidebar title="Patient Details">
              <PatientProfilePage />
            </PageWithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <AppointmentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/new"
        element={
          <ProtectedRoute>
            <AppointmentCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/:appointmentId"
        element={
          <ProtectedRoute>
            <AppointmentDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/:appointmentId/edit"
        element={
          <RoleBasedRoute
            allowedRoles={[
              USER_ROLES.ADMIN,
              USER_ROLES.RECEPTIONIST,
              USER_ROLES.DOCTOR,
            ]}
          >
            <AppointmentEditPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/medical-records/patient/:patientUserId/general"
        element={
          <ProtectedRoute>
            <MedicalRecordsPage section="general" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medical-records/patient/:patientUserId/prescriptions"
        element={
          <ProtectedRoute>
            <PrescriptionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medical-records/patient/:patientUserId/treatments"
        element={
          <ProtectedRoute>
            <TreatmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medical-records/patient/:patientUserId/observations"
        element={
          <ProtectedRoute>
            <ObservationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/dashboard"
        element={
          <RoleBasedRoute
            allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST]}
          >
            <BillingDashboardPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/billing/invoices"
        element={
          <ProtectedRoute>
            <InvoiceListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/invoices/new"
        element={
          <RoleBasedRoute
            allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST]}
          >
            <InvoiceCreatePage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/billing/invoices/:invoiceId"
        element={
          <ProtectedRoute>
            <InvoiceDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/invoices/:invoiceId/edit"
        element={
          <RoleBasedRoute
            allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST]}
          >
            <InvoiceEditPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/billing/payments/record"
        element={
          <RoleBasedRoute
            allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST]}
          >
            <PaymentPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/telemedicine/sessions"
        element={
          <ProtectedRoute>
            <TelemedicineListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/telemedicine/sessions/new"
        element={
          <ProtectedRoute>
            <TelemedicineCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/telemedicine/sessions/:sessionId"
        element={
          <ProtectedRoute>
            <TelemedicineSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/telemedicine/sessions/:sessionId/edit"
        element={
          <RoleBasedRoute
            allowedRoles={[
              USER_ROLES.ADMIN,
              USER_ROLES.RECEPTIONIST,
              USER_ROLES.DOCTOR,
              USER_ROLES.PATIENT,
            ]}
          >
            <TelemedicineEditPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/inquiries"
        element={
          <ProtectedRoute>
            <InquiryListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inquiries/new"
        element={
          <ProtectedRoute>
            {" "}
            {}
            <InquiryCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inquiries/:inquiryId"
        element={
          <ProtectedRoute>
            <InquiryDetailsPageWrapper />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
