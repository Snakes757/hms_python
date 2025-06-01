// src/routes/AdminRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PageWithSidebar from './PageWithSidebar'; // Assuming PageWithSidebar is a HOC or layout component

// Admin Specific Pages/Components
import AdminDashboard from '../components/dashboard/AdminDashboard';
import UserListPage from '../pages/admin/UserListPage';
import UserDetailsPage from '../pages/admin/UserDetailsPage'; // Page that likely uses UserDetailsEdit
import ReportsDashboardPage from '../pages/reports/ReportsDashboardPage';
import PatientStatistics from '../components/reports/PatientStatistics';
import AppointmentReportPage from '../pages/reports/AppointmentReportPage';
import FinancialReportPage from '../pages/reports/FinancialReportPage';
import StaffActivityReportPage from '../pages/reports/StaffActivityReportPage';
// Import other Admin specific components/pages here

const ROLES = { ADMIN: 'ADMIN' }; // Centralize roles if not already done

const AdminRoutes = () => {
  // These routes are intended to be nested under a path that's already protected for ADMIN role
  // e.g., in AppRoutes.jsx: <Route path="/admin/*" element={<ProtectedRoute requiredRole="ADMIN"><AdminRoutes /></ProtectedRoute>} />
  // Or, each route here can have its own ProtectedRoute wrapper if they are top-level.
  // For this example, assuming the parent route handles the top-level ADMIN protection.

  return (
    <Routes>
      <Route path="dashboard" element={<PageWithSidebar title="Administrator Dashboard"><AdminDashboard /></PageWithSidebar>} />
      
      {/* User Management */}
      <Route path="users" element={<UserListPage />} /> {/* UserListPage includes Sidebar */}
      <Route path="users/:userId" element={<UserDetailsPage />} /> {/* UserDetailsPage includes Sidebar */}
      {/* <Route path="users/new" element={<PageWithSidebar title="Create New User (Admin)"><AdminCreateUserForm /></PageWithSidebar>} /> */}

      {/* Reports */}
      <Route path="reports" element={<ReportsDashboardPage />} /> {/* ReportsDashboardPage includes Sidebar */}
      <Route path="reports/patient-statistics" element={<PageWithSidebar title="Patient Statistics Report"><PatientStatistics /></PageWithSidebar>} />
      <Route path="reports/appointment-report" element={<AppointmentReportPage />} /> {/* Includes Sidebar */}
      <Route path="reports/financial-report" element={<FinancialReportPage />} /> {/* Includes Sidebar */}
      <Route path="reports/staff-activity" element={<StaffActivityReportPage />} /> {/* Includes Sidebar */}

      {/* Catch-all for /admin/* if no other admin route matches, redirect to admin dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
