import React from "react";
import DoctorDashboard from "../../components/dashboard/DoctorDashboard";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { USER_ROLES } from "../../utils/constants";

const DoctorDashboardPage = () => {
  return (
    <ProtectedRoute requiredRole={USER_ROLES.DOCTOR}>
      <PageWithSidebar title="Doctor Dashboard">
        <DoctorDashboard />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default DoctorDashboardPage;
