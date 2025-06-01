import React from "react";
import ReceptionistDashboard from "../../components/dashboard/ReceptionistDashboard";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { USER_ROLES } from "../../utils/constants";

const ReceptionistDashboardPage = () => {
  return (
    <ProtectedRoute requiredRole={USER_ROLES.RECEPTIONIST}>
      <PageWithSidebar title="Receptionist Dashboard">
        <ReceptionistDashboard />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default ReceptionistDashboardPage;
