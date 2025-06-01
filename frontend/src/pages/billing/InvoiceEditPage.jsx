import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InvoiceForm from "../../components/billing/InvoiceForm";
import PageWithSidebar from "../../routes/PageWithSidebar";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";
import { billingApi } from "../../api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";

const InvoiceEditPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [canEditThisInvoice, setCanEditThisInvoice] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      setError("No invoice ID provided.");
      setIsLoading(false);
      return;
    }
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const checkPermissionsAndLoadData = async () => {
      setIsLoading(true);
      setError("");
      try {
        if (
          currentUser.role !== USER_ROLES.ADMIN &&
          currentUser.role !== USER_ROLES.RECEPTIONIST
        ) {
          setError("You do not have permission to edit invoices.");
          setCanEditThisInvoice(false);
          setIsLoading(false);
          return;
        }

        const data = await billingApi.getInvoiceDetails(invoiceId);
        if (data.status === "PAID" || data.status === "VOID") {
          setError(
            `Invoice #${
              data.invoice_number
            } is ${data.status_display.toLowerCase()} and cannot be edited.`
          );
          setCanEditThisInvoice(false);
        } else {
          setInvoiceNumber(data.invoice_number);
          setCanEditThisInvoice(true);
        }
      } catch (err) {
        setError(
          err.message ||
            `Failed to verify permissions or load initial data for invoice ID ${invoiceId}.`
        );
        console.error("Error in InvoiceEditPage setup:", err);
        setCanEditThisInvoice(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkPermissionsAndLoadData();
  }, [invoiceId, currentUser]);

  const handleFormSuccess = () => {
    navigate(`/billing/invoices/${invoiceId}`, {
      replace: true,
      state: { message: "Invoice updated successfully!" },
    });
  };

  if (isLoading) {
    return (
      <PageWithSidebar title="Edit Invoice">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner message="Loading invoice edit page..." />
        </div>
      </PageWithSidebar>
    );
  }

  if (error) {
    return (
      <PageWithSidebar title="Edit Invoice - Error">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate("/billing/invoices")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Back to Invoices
        </button>
      </PageWithSidebar>
    );
  }

  if (!canEditThisInvoice && !isLoading) {
    return (
      <PageWithSidebar title="Edit Invoice">
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
          role="alert"
        >
          <p className="font-bold">Access Denied or Invalid Action</p>
          <p>
            You may not have permission to edit this invoice, or the invoice is
            in a state that cannot be edited (e.g., Paid or Void).
          </p>
        </div>
        <button
          onClick={() => navigate("/billing/invoices")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Back to Invoices
        </button>
      </PageWithSidebar>
    );
  }

  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST]}>
      <PageWithSidebar
        title={`Edit Invoice ${invoiceNumber ? `#${invoiceNumber}` : ""}`}
      >
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <p className="text-gray-700 mb-6 text-sm">
            Modify the details of the invoice below. Ensure all information is
            accurate before saving.
          </p>
          <InvoiceForm
            invoiceId={invoiceId}
            onFormSubmitSuccess={handleFormSuccess}
          />
        </div>
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default InvoiceEditPage;
