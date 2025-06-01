import React from "react";
import AppointmentReport from "../../components/reports/AppointmentReport";
import PageWithSidebar from "../../routes/PageWithSidebar";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";
import { USER_ROLES } from "../../utils/constants";

const AppointmentReportPage = () => {
  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <PageWithSidebar title="Appointment Report">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <AppointmentReport />
        </div>
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default AppointmentReportPage;
