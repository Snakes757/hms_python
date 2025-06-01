import React from "react";
import InvoiceForm from "../../components/billing/InvoiceForm";
import PageWithSidebar from "../../routes/PageWithSidebar";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";
import { USER_ROLES } from "../../utils/constants";

const InvoiceCreatePage = () => {
  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST]}>
      <PageWithSidebar title="Create New Invoice">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <p className="text-gray-700 mb-6 text-sm">
            Fill out the details below to generate a new invoice for a patient.
            Ensure all services and items are accurately listed. The invoice
            will be created in 'Draft' status.
          </p>
          <InvoiceForm />
        </div>
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default InvoiceCreatePage;
