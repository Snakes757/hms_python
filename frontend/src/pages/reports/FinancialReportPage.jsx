import React from "react";
import FinancialReport from "../../components/reports/FinancialReport";
import PageWithSidebar from "../../routes/PageWithSidebar";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";
import { USER_ROLES } from "../../utils/constants";

const FinancialReportPage = () => {
  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <PageWithSidebar title="Financial Report">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <FinancialReport />
        </div>
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default FinancialReportPage;
