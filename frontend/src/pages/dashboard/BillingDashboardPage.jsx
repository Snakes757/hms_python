import React from "react";
import BillingDashboard from "../../components/billing/BillingDashboard";
import PageWithSidebar from "../../routes/PageWithSidebar";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";
import { USER_ROLES } from "../../utils/constants";

const BillingDashboardPage = () => {
  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST]}>
      <PageWithSidebar title="Billing Dashboard">
        <BillingDashboard />
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default BillingDashboardPage;
