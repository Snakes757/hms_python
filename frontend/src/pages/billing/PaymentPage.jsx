// src/pages/billing/PaymentPage.jsx
import React, { useState, useContext } from 'react';
import PaymentForm from '../../components/billing/PaymentForm';
import Sidebar from '../../components/common/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { getInvoiceDetails } from '../../api/billing'; // To fetch invoice details by number
import LoadingSpinner from '../../components/common/LoadingSpinner';
import usePermissions from '../../hooks/usePermissions';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PaymentPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { can } = usePermissions();

  const [invoiceNumberSearch, setInvoiceNumberSearch] = useState('');
  const [searchedInvoice, setSearchedInvoice] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [paymentRecorded, setPaymentRecorded] = useState(false);

  const handleSearchInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceNumberSearch.trim()) {
      setSearchError('Please enter an invoice number to search.');
      setSearchedInvoice(null);
      return;
    }
    setIsLoadingInvoice(true);
    setSearchError('');
    setSearchedInvoice(null);
    setPaymentRecorded(false);

    try {
      // The backend API for invoices uses ID, not invoice_number, for direct GET.
      // We would need an API endpoint like GET /api/v1/billing/invoices/?invoice_number=INV-XYZ
      // For now, assuming listInvoices can be filtered by invoice_number or we fetch one by one (not ideal).
      // Let's simulate a direct fetch if an endpoint like /api/v1/billing/invoices/find_by_number/{invoice_number}/ existed
      // Or, if getInvoiceDetails could take invoice_number (which it currently doesn't, it takes ID).

      // This is a simplified approach: We'll assume we need to list and find.
      // A better backend would have a direct lookup.
      // For this example, we'll mock this part or assume an ID is entered if no direct number lookup.
      // Let's modify this to expect an INVOICE ID for search for simplicity with current API.
      
      // To truly search by invoice_number, the `listInvoices` API would need to support it as a query param.
      // const invoices = await listInvoices({ invoice_number: invoiceNumberSearch });
      // if (invoices && invoices.length > 0) {
      //   setSearchedInvoice(invoices[0]);
      // } else {
      //   setSearchError(`Invoice with number "${invoiceNumberSearch}" not found.`);
      // }

      // SIMPLIFICATION: Assume user enters INVOICE ID for now, as getInvoiceDetails takes ID.
      // If you want to search by invoice_number, the backend API needs to support that query.
      const invoiceId = parseInt(invoiceNumberSearch, 10);
      if (isNaN(invoiceId)) {
        setSearchError('Please enter a valid Invoice ID (numeric). For search by number, API needs update.');
        setIsLoadingInvoice(false);
        return;
      }
      const data = await getInvoiceDetails(invoiceId);
      if (data.status === 'PAID' || data.status === 'VOID') {
        setSearchError(`Invoice ${data.invoice_number} is already ${data.status.toLowerCase()} and cannot accept new payments.`);
        setSearchedInvoice(data); // Still show details
      } else {
        setSearchedInvoice(data);
      }

    } catch (err) {
      setSearchError(err.message || 'Failed to find invoice. Please check the ID and try again.');
      setSearchedInvoice(null);
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentRecorded(true);
    // Re-fetch invoice details to show updated amount due and status
    if (searchedInvoice) {
      setIsLoadingInvoice(true);
      getInvoiceDetails(searchedInvoice.id)
        .then(data => setSearchedInvoice(data))
        .catch(err => setSearchError(err.message || "Error refreshing invoice details."))
        .finally(() => setIsLoadingInvoice(false));
    }
  };

  if (!currentUser || !can('RECORD_PAYMENT')) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="container-fluid mt-4 flex-grow-1">
          <div className="alert alert-danger">Access Denied. You do not have permission to record payments.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <h1>Record Payment</h1>
        <p>Search for an invoice by its ID to record a payment against it.</p>

        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <form onSubmit={handleSearchInvoice} className="row g-3 align-items-end">
              <div className="col-md-8">
                <label htmlFor="invoiceNumberSearch" className="form-label">Invoice ID</label>
                <input
                  type="text" // Changed to text to allow INV- prefix if backend supports it later
                  className="form-control"
                  id="invoiceNumberSearch"
                  value={invoiceNumberSearch}
                  onChange={(e) => setInvoiceNumberSearch(e.target.value)}
                  placeholder="Enter Invoice ID (e.g., 123)"
                />
              </div>
              <div className="col-md-4">
                <button type="submit" className="btn btn-primary w-100" disabled={isLoadingInvoice}>
                  {isLoadingInvoice ? <LoadingSpinner size="sm" message="Searching..." /> : 'Search Invoice'}
                </button>
              </div>
            </form>
            {searchError && <div className="alert alert-danger mt-3">{searchError}</div>}
          </div>
        </div>

        {isLoadingInvoice && !searchedInvoice && <LoadingSpinner message="Fetching invoice details..." />}

        {searchedInvoice && (
          <div className="card shadow-sm mb-4">
            <div className="card-header">
              <h5 className="mb-0">Invoice Details: {searchedInvoice.invoice_number}</h5>
            </div>
            <div className="card-body">
              <p><strong>Patient:</strong> {searchedInvoice.patient_details?.user?.first_name} {searchedInvoice.patient_details?.user?.last_name}</p>
              <p><strong>Status:</strong> <span className={`badge bg-${searchedInvoice.status === 'PAID' || searchedInvoice.status === 'VOID' ? 'secondary' : 'warning'}`}>{searchedInvoice.status_display || searchedInvoice.status}</span></p>
              <p><strong>Total Amount:</strong> {formatCurrency(searchedInvoice.total_amount)}</p>
              <p><strong>Amount Paid:</strong> {formatCurrency(searchedInvoice.paid_amount)}</p>
              <p className="fw-bold">Amount Due: {formatCurrency(searchedInvoice.amount_due)}</p>
              <p><small className="text-muted">Issue Date: {formatDate(searchedInvoice.issue_date)} | Due Date: {formatDate(searchedInvoice.due_date)}</small></p>
            </div>
          </div>
        )}

        {paymentRecorded && searchedInvoice && (
            <div className="alert alert-success">
                Payment recorded successfully for invoice {searchedInvoice.invoice_number}! Amount due is now {formatCurrency(searchedInvoice.amount_due)}.
            </div>
        )}

        {searchedInvoice && searchedInvoice.status !== 'PAID' && searchedInvoice.status !== 'VOID' && !paymentRecorded && (
          <PaymentForm
            invoiceId={searchedInvoice.id}
            currentAmountDue={parseFloat(searchedInvoice.amount_due)}
            onPaymentRecorded={handlePaymentSuccess}
            onCancel={() => { 
                setSearchedInvoice(null); 
                setInvoiceNumberSearch('');
                setPaymentRecorded(false);
            }} // Clear search on cancel
          />
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
