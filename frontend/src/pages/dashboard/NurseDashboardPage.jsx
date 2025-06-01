import React from "react";
import NurseDashboard from "../../components/dashboard/NurseDashboard";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { USER_ROLES } from "../../utils/constants";

const NurseDashboardPage = () => {
  return (
    <ProtectedRoute requiredRole={USER_ROLES.NURSE}>
      <PageWithSidebar title="Nurse Dashboard">
        <NurseDashboard />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default NurseDashboardPage;
