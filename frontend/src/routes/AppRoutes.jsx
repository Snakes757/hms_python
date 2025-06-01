import React, { useContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ProtectedRoute from "../components/common/ProtectedRoute";
import RoleBasedRoute from "../components/common/RoleBasedRoute"; // Assuming RoleBasedRoute handles array of roles

// Page Imports
import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Register";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import HomePage from "../pages/Home"; // General authenticated homepage/dashboard router
import UserProfilePage from "../pages/profile/UserProfilePage"; // User's own profile
import ProfileSettingsPage from "../pages/profile/ProfileSettingsPage";

// Patient Specific Pages/Components
import PatientProfilePage from "../pages/patients/PatientProfilePage"; // Viewing a patient's profile (can be self or by staff)
import MedicalRecordsPage from "../pages/medical/MedicalRecordsPage";
import PrescriptionsPage from "../pages/medical/PrescriptionsPage";
import TreatmentsPage from "../pages/medical/TreatmentsPage";
import ObservationsPage from "../pages/medical/ObservationsPage";

// Appointment Pages
import AppointmentListPage from "../pages/appointments/AppointmentListPage";
import AppointmentCreatePage from "../pages/appointments/AppointmentCreatePage";
import AppointmentDetailsPage from "../pages/appointments/AppointmentDetailsPage";
import AppointmentEditPage from "../pages/appointments/AppointmentEditPage"; // Assuming this exists or will be created

// Billing Pages
import InvoiceListPage from "../pages/billing/InvoiceListPage";
import InvoiceCreatePage from "../pages/billing/InvoiceCreatePage"; // Assuming this exists
import InvoiceDetailsPage from "../pages/billing/InvoiceDetailsPage";
import InvoiceEditPage from "../pages/billing/InvoiceEditPage"; // Assuming this exists
import PaymentPage from "../pages/billing/PaymentPage";
import BillingDashboardPage from "../pages/dashboard/BillingDashboardPage";

// Telemedicine Pages
import TelemedicineListPage from "../pages/telemedicine/TelemedicineListPage";
import TelemedicineSessionPage from "../pages/telemedicine/TelemedicineSessionPage";
import TelemedicineCreatePage from "../pages/telemedicine/TelemedicineCreatePage"; // Assuming this exists
import TelemedicineEditPage from "../pages/telemedicine/TelemedicineEditPage"; // Assuming this exists

// Inquiry Pages
import InquiryListPage from "../pages/inquiries/InquiryListPage";
import InquiryCreatePage from "../pages/inquiries/InquiryCreatePage";
import InquiryDetailsPageWrapper from "./InquiryDetailsPageWrapper"; // Wrapper for InquiryDetails

// Role-Specific Route Groups
import AdminRoutes from "./AdminRoutes";
import DoctorRoutes from "./DoctorRoutes"; // Assuming this will be fleshed out
import NurseRoutes from "./NurseRoutes"; // Assuming this will be fleshed out
import ReceptionistRoutes from "./ReceptionistRoutes"; // Assuming this will be fleshed out

// Common Pages
import NotFoundPage from "../pages/NotFound";
import UnauthorizedPage from "../pages/Unauthorized";

import { USER_ROLES } from "../utils/constants";

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/reset-password/:uid/:token"
        element={<ResetPasswordPage />}
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />{" "}
      {/* For links that might not have params in URL path directly */}
      <Route path="/contact-us" element={<InquiryCreatePage />} />
      <Route path="/submit-inquiry" element={<InquiryCreatePage />} />
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
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/profile/me"
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/settings"
        element={
          <ProtectedRoute>
            <ProfileSettingsPage />
          </ProtectedRoute>
        }
      />
      {/* Patient Profile Viewing (self or by authorized staff) */}
      <Route
        path="/patients/:userId" // This can be used by staff to view patient profiles, or patient for their own.
        element={
          <ProtectedRoute>
            <PatientProfilePage />
          </ProtectedRoute>
        }
      />
      {/* Appointments Routes - Accessible by all authenticated, behavior inside components may differ */}
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
      {/* Medical Information Routes - Primarily for patients (own) and relevant staff */}
      {/* MedicalRecordsPage already handles logic for patient viewing own or staff viewing specific patient */}
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
      {/* A patient's own records shortcut */}
      <Route
        path="/my-records"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.PATIENT}>
            {" "}
            <Navigate to={`/patients/${user?.id}`} replace />{" "}
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-appointments"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.PATIENT}>
            {" "}
            <Navigate to={`/appointments`} replace />{" "}
          </ProtectedRoute>
        }
      />
      {/* Billing Routes */}
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
            {" "}
            {/* Patient can view own, staff can view all/create */}
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
            {" "}
            {/* Patient can view own, staff can view details */}
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
      {/* Telemedicine Routes */}
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
            {" "}
            {/* Patient for feedback */}
            <TelemedicineEditPage />
          </RoleBasedRoute>
        }
      />
      {/* Inquiries Routes */}
      <Route
        path="/inquiries"
        element={
          <ProtectedRoute>
            <InquiryListPage />
          </ProtectedRoute>
        }
      />
      {/* InquiryCreatePage is public too, but if logged in, it might prefill data */}
      <Route path="/inquiries/new" element={<InquiryCreatePage />} />
      <Route
        path="/inquiries/:inquiryId"
        element={
          <ProtectedRoute>
            <InquiryDetailsPageWrapper />
          </ProtectedRoute>
        }
      />
      {/* Role-Specific Sections */}
      <Route path="/admin/*" element={<AdminRoutes />} />
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
      {/* Patient specific routes could also be grouped if they grow complex, for now many are top-level */}
      {/* Fallback for any unmatched routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
