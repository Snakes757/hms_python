import React from "react";
import { useParams } from "react-router-dom";
import InvoiceDetails from "../../components/billing/InvoiceDetails";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";

const InvoiceDetailsPage = () => {
  const { invoiceId } = useParams();

  return (
    <ProtectedRoute>
      <PageWithSidebar title={`Invoice Details (ID: ${invoiceId})`}>
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <InvoiceDetails invoiceIdParam={invoiceId} />
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default InvoiceDetailsPage;
