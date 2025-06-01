import React from "react";
import PatientDashboard from "../../components/dashboard/PatientDashboard";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { USER_ROLES } from "../../utils/constants";

const PatientDashboardPage = () => {
  return (
    <ProtectedRoute requiredRole={USER_ROLES.PATIENT}>
      <PageWithSidebar title="Patient Dashboard">
        <PatientDashboard />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default PatientDashboardPage;
