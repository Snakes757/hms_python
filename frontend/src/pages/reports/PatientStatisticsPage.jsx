import React from "react";
import PatientStatistics from "../../components/reports/PatientStatistics"; // Component to render the report
import PageWithSidebar from "../../routes/PageWithSidebar"; // Layout component
import ProtectedRoute from "../../components/common/ProtectedRoute"; // For role-based access
import { USER_ROLES } from "../../utils/constants"; // User roles constants

/**
 * @file PatientStatisticsPage.jsx
 * @description Page component for displaying the Patient Statistics Report.
 * This page is protected and accessible only to users with the ADMIN role.
 * It uses the PageWithSidebar component for consistent layout.
 */

const PatientStatisticsPage = () => {
  return (
    <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
      <PageWithSidebar title="Patient Statistics Report">
        <PatientStatistics />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default PatientStatisticsPage;
