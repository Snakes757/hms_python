import React from "react";
import StaffActivityReport from "../../components/reports/StaffActivityReport";
import PageWithSidebar from "../../routes/PageWithSidebar";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";
import { USER_ROLES } from "../../utils/constants";

const StaffActivityReportPage = () => {
  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <PageWithSidebar title="Staff Activity Report">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <StaffActivityReport />
        </div>
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default StaffActivityReportPage;
