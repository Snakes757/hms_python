import React from "react";
import PatientStatistics from "../../components/reports/PatientStatistics";
import PageWithSidebar from "../../routes/PageWithSidebar";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";
import { USER_ROLES } from "../../utils/constants";

const PatientStatisticsPage = () => {
  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <PageWithSidebar title="Patient Statistics Report">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <PatientStatistics />
        </div>
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default PatientStatisticsPage;
