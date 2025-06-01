// src/components/billing/InvoiceDetails.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInvoiceDetails, listPaymentsForInvoice, deleteInvoice } from '../../api/billing';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import PaymentForm from './PaymentForm'; // To record new payments

const INVOICE_STATUS_CLASSES = {
  DRAFT: 'secondary',
  SENT: 'info',
  PAID: 'success',
  PARTIALLY_PAID: 'primary',
  VOID: 'dark',
  OVERDUE: 'danger',
};

const PAYMENT_METHOD_DISPLAY = {
    CASH: 'Cash',
    CREDIT_CARD: 'Credit Card',
    DEBIT_CARD: 'Debit Card',
    BANK_TRANSFER: 'Bank Transfer',
    INSURANCE: 'Insurance Claim',
    MOBILE_MONEY: 'Mobile Money',
    OTHER: 'Other',
};


const InvoiceDetails = ({ invoiceIdParam }) => {
  const { invoiceId: routeInvoiceId } = useParams();
  const invoiceId = invoiceIdParam || routeInvoiceId;

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { user: currentUser } = useContext(AuthContext);

  const fetchInvoiceAndPayments = async () => {
    if (!invoiceId) {
      setError("Invoice ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const invoiceData = await getInvoiceDetails(invoiceId);
      setInvoice(invoiceData);
      const paymentsData = await listPaymentsForInvoice(invoiceId);
      setPayments(paymentsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoice details.');
      console.error("Error fetching invoice details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceAndPayments();
  }, [invoiceId]);

  const handlePaymentRecorded = () => {
    setShowPaymentForm(false);
    fetchInvoiceAndPayments(); // Refresh invoice details (especially paid_amount and status) and payments list
  };
  
  const handleVoidInvoice = async () => {
    if (window.confirm('Are you sure you want to void this invoice? This may not be reversible if payments exist.')) {
      setIsLoading(true);
      try {
        await deleteInvoice(invoiceId); // Backend handles voiding
        fetchInvoiceAndPayments(); // Refresh invoice details
      } catch (err) {
        setError(err.message || 'Failed to void invoice.');
      } finally {
        setIsLoading(false);
      }
    }
  };


  if (isLoading && !invoice) {
    return <LoadingSpinner message="Loading invoice details..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }

  if (!invoice) {
    return <div className="alert alert-warning mt-3">Invoice not found.</div>;
  }

  const { patient_details, created_by_details, items } = invoice;
  const canManageInvoice = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST');
  const canRecordPayment = canManageInvoice && invoice.status !== 'PAID' && invoice.status !== 'VOID';


  return (
    <div className="container mt-4">
      {/* Invoice Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Invoice #{invoice.invoice_number}</h2>
        <div>
          {canManageInvoice && invoice.status !== 'VOID' && invoice.status !== 'PAID' && (
            <Link to={`/billing/invoices/${invoiceId}/edit`} className="btn btn-secondary btn-sm me-2">
              Edit Invoice
            </Link>
          )}
          {canManageInvoice && invoice.status !== 'VOID' && (
            <button 
              className="btn btn-warning btn-sm" 
              onClick={handleVoidInvoice}
              disabled={isLoading || invoice.status === 'PAID' || (invoice.status === 'PARTIALLY_PAID' && invoice.payments.length > 0)}
            >
              Void Invoice
            </button>
          )}
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Invoice Details Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header">
          <h4 className="mb-0">Details</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Patient:</strong> {patient_details?.user?.first_name} {patient_details?.user?.last_name} (ID: {patient_details?.user?.id})</p>
              <p><strong>Issue Date:</strong> {new Date(invoice.issue_date).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Status:</strong> <span className={`badge bg-${INVOICE_STATUS_CLASSES[invoice.status] || 'secondary'}`}>{invoice.status_display || invoice.status}</span>
                {invoice.is_overdue && invoice.status !== 'PAID' && invoice.status !== 'VOID' && <span className="badge bg-warning text-dark ms-1">Overdue</span>}
              </p>
              <p><strong>Total Amount:</strong> ${parseFloat(invoice.total_amount).toFixed(2)}</p>
              <p><strong>Amount Paid:</strong> ${parseFloat(invoice.paid_amount).toFixed(2)}</p>
              <p><strong>Amount Due:</strong> <span className="fw-bold">${parseFloat(invoice.amount_due).toFixed(2)}</span></p>
            </div>
          </div>
          {invoice.notes && <p><strong>Notes:</strong> {invoice.notes}</p>}
          {created_by_details && <p><small className="text-muted">Created by: {created_by_details.first_name} {created_by_details.last_name} on {new Date(invoice.created_at).toLocaleDateString()}</small></p>}
        </div>
      </div>

      {/* Invoice Items Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header">
          <h4 className="mb-0">Invoice Items</h4>
        </div>
        <div className="card-body p-0"> {/* Remove padding for full-width table */}
          {items && items.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Description</th>
                    <th className="text-end">Quantity</th>
                    <th className="text-end">Unit Price</th>
                    <th className="text-end">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td className="text-end">{item.quantity}</td>
                      <td className="text-end">${parseFloat(item.unit_price).toFixed(2)}</td>
                      <td className="text-end">${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-3 text-muted">No items found for this invoice.</p>
          )}
        </div>
      </div>

      {/* Payments Section Card */}
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Payments</h4>
          {canRecordPayment && !showPaymentForm && (
            <button className="btn btn-success btn-sm" onClick={() => setShowPaymentForm(true)}>
              Record Payment
            </button>
          )}
        </div>
        <div className="card-body">
          {showPaymentForm && (
            <PaymentForm 
              invoiceId={invoiceId} 
              currentAmountDue={parseFloat(invoice.amount_due)}
              onPaymentRecorded={handlePaymentRecorded} 
              onCancel={() => setShowPaymentForm(false)}
            />
          )}
          {!showPaymentForm && payments && payments.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th className="text-end">Amount</th>
                    <th>Method</th>
                    <th>Transaction ID</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td>{new Date(payment.payment_date).toLocaleString()}</td>
                      <td className="text-end">${parseFloat(payment.amount).toFixed(2)}</td>
                      <td>{PAYMENT_METHOD_DISPLAY[payment.payment_method] || payment.payment_method}</td>
                      <td>{payment.transaction_id || 'N/A'}</td>
                      <td>{payment.recorded_by_details?.first_name || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !showPaymentForm && (
            <p className="text-muted">No payments recorded for this invoice yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
