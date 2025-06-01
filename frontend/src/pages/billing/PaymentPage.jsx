import React, { useState, useContext } from "react";
import PaymentForm from "../../components/billing/PaymentForm";
import PageWithSidebar from "../../routes/PageWithSidebar";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";
import { AuthContext } from "../../context/AuthContext";
import { billingApi } from "../../api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { USER_ROLES } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/formatters";

const PaymentPage = () => {
  const { user: currentUser } = useContext(AuthContext);

  const [invoiceNumberSearch, setInvoiceNumberSearch] = useState("");
  const [searchedInvoice, setSearchedInvoice] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [paymentRecorded, setPaymentRecorded] = useState(false);

  const handleSearchInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceNumberSearch.trim()) {
      setSearchError("Please enter an invoice ID to search.");
      setSearchedInvoice(null);
      return;
    }
    setIsLoadingInvoice(true);
    setSearchError("");
    setSearchedInvoice(null);
    setPaymentRecorded(false);

    try {
      const invoiceId = parseInt(invoiceNumberSearch, 10);
      if (isNaN(invoiceId)) {
        setSearchError("Please enter a valid Invoice ID (numeric).");
        setIsLoadingInvoice(false);
        return;
      }
      const data = await billingApi.getInvoiceDetails(invoiceId);
      if (data.status === "PAID" || data.status === "VOID") {
        setSearchError(
          `Invoice ${
            data.invoice_number
          } is already ${data.status_display.toLowerCase()} and cannot accept new payments.`
        );
        setSearchedInvoice(data); // Still show details
      } else {
        setSearchedInvoice(data);
      }
    } catch (err) {
      setSearchError(
        err.message ||
          "Failed to find invoice. Please check the ID and try again."
      );
      setSearchedInvoice(null);
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentRecorded(true);
    if (searchedInvoice) {
      setIsLoadingInvoice(true);
      billingApi
        .getInvoiceDetails(searchedInvoice.id)
        .then((data) => setSearchedInvoice(data))
        .catch((err) =>
          setSearchError(err.message || "Error refreshing invoice details.")
        )
        .finally(() => setIsLoadingInvoice(false));
    }
  };

  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST]}>
      <PageWithSidebar title="Record Payment">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Search for Invoice
            </h2>
            <form
              onSubmit={handleSearchInvoice}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
            >
              <div className="md:col-span-2">
                <label
                  htmlFor="invoiceNumberSearch"
                  className="block text-sm font-medium text-gray-700"
                >
                  Invoice ID
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  id="invoiceNumberSearch"
                  value={invoiceNumberSearch}
                  onChange={(e) => setInvoiceNumberSearch(e.target.value)}
                  placeholder="Enter Invoice ID (e.g., 123)"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isLoadingInvoice}
                >
                  {isLoadingInvoice ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    "Search Invoice"
                  )}
                </button>
              </div>
            </form>
            {searchError && (
              <div className="mt-3 text-sm text-red-600 bg-red-100 p-3 rounded-md">
                {searchError}
              </div>
            )}
          </div>

          {isLoadingInvoice && !searchedInvoice && (
            <div className="flex justify-center py-6">
              <LoadingSpinner message="Fetching invoice details..." />
            </div>
          )}

          {searchedInvoice && (
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Invoice Details: {searchedInvoice.invoice_number}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p>
                  <strong className="text-gray-600">Patient:</strong>{" "}
                  {searchedInvoice.patient_details?.user?.first_name}{" "}
                  {searchedInvoice.patient_details?.user?.last_name}
                </p>
                <p>
                  <strong className="text-gray-600">Status:</strong>{" "}
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      searchedInvoice.status === "PAID" ||
                      searchedInvoice.status === "VOID"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {searchedInvoice.status_display || searchedInvoice.status}
                  </span>
                </p>
                <p>
                  <strong className="text-gray-600">Total Amount:</strong>{" "}
                  {formatCurrency(searchedInvoice.total_amount)}
                </p>
                <p>
                  <strong className="text-gray-600">Amount Paid:</strong>{" "}
                  {formatCurrency(searchedInvoice.paid_amount)}
                </p>
                <p className="font-bold text-base">
                  <strong className="text-gray-600">Amount Due:</strong>{" "}
                  {formatCurrency(searchedInvoice.amount_due)}
                </p>
                <p>
                  <strong className="text-gray-600">Issue Date:</strong>{" "}
                  {formatDate(searchedInvoice.issue_date)}
                </p>
                <p>
                  <strong className="text-gray-600">Due Date:</strong>{" "}
                  {formatDate(searchedInvoice.due_date)}
                </p>
              </div>
            </div>
          )}

          {paymentRecorded && searchedInvoice && (
            <div
              className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md"
              role="alert"
            >
              <p className="font-bold">Payment Recorded!</p>
              <p>
                Payment recorded successfully for invoice{" "}
                {searchedInvoice.invoice_number}. Amount due is now{" "}
                {formatCurrency(searchedInvoice.amount_due)}.
              </p>
            </div>
          )}

          {searchedInvoice &&
            searchedInvoice.status !== "PAID" &&
            searchedInvoice.status !== "VOID" &&
            !paymentRecorded && (
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <PaymentForm
                  invoiceId={searchedInvoice.id}
                  currentAmountDue={parseFloat(searchedInvoice.amount_due)}
                  onPaymentRecorded={handlePaymentSuccess}
                  onCancel={() => {
                    setSearchedInvoice(null);
                    setInvoiceNumberSearch("");
                    setPaymentRecorded(false);
                  }}
                />
              </div>
            )}
        </div>
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default PaymentPage;
