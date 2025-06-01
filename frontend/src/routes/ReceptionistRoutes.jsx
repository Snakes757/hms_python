import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import PageWithSidebar from "./PageWithSidebar";

import ReceptionistDashboardPage from "../pages/dashboard/ReceptionistDashboardPage";
import PatientListPage from "../pages/patients/PatientListPage";
import PatientProfilePage from "../pages/patients/PatientProfilePage";
import RegisterPage from "../pages/Register"; // For patient registration by receptionist
import AppointmentListPage from "../pages/appointments/AppointmentListPage";
import AppointmentCreatePage from "../pages/appointments/AppointmentCreatePage";
import AppointmentDetailsPage from "../pages/appointments/AppointmentDetailsPage";
import AppointmentEditPage from "../pages/appointments/AppointmentEditPage";
import BillingDashboardPage from "../pages/dashboard/BillingDashboardPage";
import InvoiceListPage from "../pages/billing/InvoiceListPage";
import InvoiceCreatePage from "../pages/billing/InvoiceCreatePage";
import InvoiceDetailsPage from "../pages/billing/InvoiceDetailsPage";
import InvoiceEditPage from "../pages/billing/InvoiceEditPage";
import PaymentPage from "../pages/billing/PaymentPage";
import InquiryListPage from "../pages/inquiries/InquiryListPage";
import InquiryCreatePage from "../pages/inquiries/InquiryCreatePage";
import InquiryDetailsPageWrapper from "./InquiryDetailsPageWrapper";
import TelemedicineListPage from "../pages/telemedicine/TelemedicineListPage";
import TelemedicineCreatePage from "../pages/telemedicine/TelemedicineCreatePage";
import TelemedicineSessionPage from "../pages/telemedicine/TelemedicineSessionPage";
import TelemedicineEditPage from "../pages/telemedicine/TelemedicineEditPage";
import UserProfilePage from "../pages/profile/UserProfilePage";
import ProfileSettingsPage from "../pages/profile/ProfileSettingsPage";

import { USER_ROLES } from "../utils/constants";

const ReceptionistRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<ReceptionistDashboardPage />} />
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
        path="patient-registration"
        element={
          <PageWithSidebar title="Register New Patient">
            <RegisterPage />
          </PageWithSidebar>
        }
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

      <Route path="billing/dashboard" element={<BillingDashboardPage />} />
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

      <Route path="inquiries" element={<InquiryListPage />} />
      <Route path="inquiries/new" element={<InquiryCreatePage />} />
      <Route
        path="inquiries/:inquiryId"
        element={<InquiryDetailsPageWrapper />}
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

export default ReceptionistRoutes;
