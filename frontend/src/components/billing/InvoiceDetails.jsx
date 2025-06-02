import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getInvoiceDetails, listPaymentsForInvoice, deleteInvoice, updateInvoice } from '../../api/billing'; // Added updateInvoice
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import PaymentForm from './PaymentForm'; // Assuming this will also be styled with Tailwind
import { formatDate, formatCurrency, formatDateTime, capitalizeWords } from '../../utils/formatters';
import { USER_ROLES } from '../../utils/constants';
import { EyeIcon, PencilIcon, TrashIcon, CreditCardIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const INVOICE_STATUS_CLASSES = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  VOID: 'bg-red-100 text-red-800',
  OVERDUE: 'bg-orange-100 text-orange-800',
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
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setSuccess('');
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
    setSuccess("Payment recorded successfully!");
    fetchInvoiceAndPayments(); // Refresh data
  };

  const handleVoidInvoice = async () => {
    if (window.confirm('Are you sure you want to void this invoice? This may not be reversible if payments exist.')) {
      setIsLoading(true);
      try {
        // Assuming deleteInvoice API call actually sets the status to VOID or soft deletes.
        // For a true "void" operation, you might need an updateInvoice API call.
        // For this example, we'll use updateInvoice to set status to 'VOID'.
        await updateInvoice(invoiceId, { ...invoice, status: 'VOID' });
        setSuccess("Invoice voided successfully!");
        fetchInvoiceAndPayments();
      } catch (err) {
        setError(err.message || 'Failed to void invoice.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading && !invoice) {
    return <div className="flex justify-center items-center p-10"><LoadingSpinner message="Loading invoice details..." /></div>;
  }

  if (error && !invoice) { // Only show main error if invoice hasn't loaded at all
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{error}</div>;
  }
  
  if (!invoice) {
     return <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">Invoice not found.</div>;
  }

  const { patient_details, created_by_details, items } = invoice;
  const canManageInvoice = currentUser && (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST);
  const canRecordPayment = canManageInvoice && invoice.status !== 'PAID' && invoice.status !== 'VOID';

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm" role="alert">{error}</div>}
      {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md text-sm" role="alert">{success}</div>}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Invoice #{invoice.invoice_number}</h2>
        <div className="flex space-x-2">
          {canManageInvoice && invoice.status !== 'VOID' && invoice.status !== 'PAID' && (
            <Link
              to={`/billing/invoices/${invoiceId}/edit`}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
            >
              <PencilIcon className="h-4 w-4 mr-1.5" /> Edit
            </Link>
          )}
          {canManageInvoice && invoice.status !== 'VOID' && (
            <button
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              onClick={handleVoidInvoice}
              disabled={isLoading || invoice.status === 'PAID' || (invoice.status === 'PARTIALLY_PAID' && invoice.payments.length > 0)}
              title={ (invoice.status === 'PAID' || (invoice.status === 'PARTIALLY_PAID' && invoice.payments.length > 0)) ? "Cannot void invoice with payments" : "Void Invoice"}
            >
              <TrashIcon className="h-4 w-4 mr-1.5" /> Void
            </button>
          )}
        </div>
      </div>

      {/* Invoice Details Card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Summary</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Patient</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {patient_details?.user?.first_name} {patient_details?.user?.last_name} (ID: {patient_details?.user?.id})
              </dd>
            </div>
            <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(invoice.issue_date)}</dd>
            </div>
            <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(invoice.due_date)}</dd>
            </div>
            <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${INVOICE_STATUS_CLASSES[invoice.status] || 'bg-gray-100 text-gray-800'}`}>
                  {capitalizeWords(invoice.status_display || invoice.status?.replace(/_/g, ' '))}
                </span>
                {invoice.is_overdue && invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
                  <span className="ml-2 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 items-center">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" /> Overdue
                  </span>
                )}
              </dd>
            </div>
            <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatCurrency(invoice.total_amount)}</dd>
            </div>
            <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatCurrency(invoice.paid_amount)}</dd>
            </div>
            <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Amount Due</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">{formatCurrency(invoice.amount_due)}</dd>
            </div>
            {invoice.notes && (
              <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{invoice.notes}</dd>
              </div>
            )}
            {created_by_details && (
              <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">
                  {created_by_details.first_name} {created_by_details.last_name} on {formatDate(invoice.created_at)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Invoice Items Card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Items</h3>
        </div>
        <div className="p-0">
          {items && items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-medium">{formatCurrency(item.quantity * parseFloat(item.unit_price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-4 text-sm text-gray-500">No items found for this invoice.</p>
          )}
        </div>
      </div>

      {/* Payments Card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Payments</h3>
          {canRecordPayment && !showPaymentForm && (
            <button
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              onClick={() => setShowPaymentForm(true)}
            >
              <CreditCardIcon className="h-4 w-4 mr-1.5" /> Record Payment
            </button>
          )}
        </div>
        <div className="p-4 sm:p-6">
          {showPaymentForm && (
            <PaymentForm
              invoiceId={invoiceId}
              currentAmountDue={parseFloat(invoice.amount_due)}
              onPaymentRecorded={handlePaymentRecorded}
              onCancel={() => setShowPaymentForm(false)}
            />
          )}
          {!showPaymentForm && payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">{formatDateTime(payment.payment_date)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-500 text-right">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-500">{PAYMENT_METHOD_DISPLAY[payment.payment_method] || payment.payment_method}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-500">{payment.transaction_id || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-500">{payment.recorded_by_details?.first_name || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !showPaymentForm && (
            <p className="text-sm text-gray-500">No payments recorded for this invoice yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
