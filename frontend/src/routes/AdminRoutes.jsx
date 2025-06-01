import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import PageWithSidebar from "./PageWithSidebar";

import AdminDashboardPage from "../pages/dashboard/AdminDashboardPage";
import UserListPage from "../pages/admin/UserListPage";
import UserCreatePage from "../pages/admin/UserCreatePage";
import UserDetailsPage from "../pages/admin/UserDetailsPage";

import ReportsDashboardPage from "../pages/reports/ReportsDashboardPage";
import PatientStatisticsPage from "../pages/reports/PatientStatisticsPage";
import AppointmentReportPage from "../pages/reports/AppointmentReportPage";
import FinancialReportPage from "../pages/reports/FinancialReportPage";
import StaffActivityReportPage from "../pages/reports/StaffActivityReportPage";

import { USER_ROLES } from "../utils/constants";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route
        path="dashboard"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="users"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <UserListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="users/new"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <UserCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="users/:userId"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <UserDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="reports"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <ReportsDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="reports/patient-statistics"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <PatientStatisticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="reports/appointment-report"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <AppointmentReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="reports/financial-report"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <FinancialReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="reports/staff-activity"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <StaffActivityReportPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
