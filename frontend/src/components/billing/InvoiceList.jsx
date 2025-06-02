import React, { useState, useEffect, useContext } from 'react';
import { listInvoices, deleteInvoice } from '../../api/billing'; // Assuming deleteInvoice is void/soft delete
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency, capitalizeWords } from '../../utils/formatters';
import { USER_ROLES } from '../../utils/constants';

const INVOICE_STATUS_CLASSES = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800', // Changed for better contrast
  VOID: 'bg-red-100 text-red-800', // Changed for better contrast with delete
  OVERDUE: 'bg-orange-100 text-orange-800', // Using orange for overdue
};

const InvoiceList = ({ forPatientId }) => {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const fetchInvoices = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError('');
    try {
      let params = {};
      if (forPatientId) {
        params.patient__user__id = forPatientId;
      } else if (currentUser.role === USER_ROLES.PATIENT) {
        params.patient__user__id = currentUser.id;
      }
      // For staff (Admin/Receptionist), fetch all if no specific patient ID
      const data = await listInvoices(params);
      setInvoices(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch invoices.');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentUser, forPatientId]);

  const handleVoidInvoice = async (invoiceId) => {
    // In a real app, you might want a more robust confirmation, perhaps a modal.
    if (window.confirm('Are you sure you want to void this invoice? This action might be irreversible for paid/partially paid invoices without further steps.')) {
      setIsLoading(true);
      try {
        // Assuming deleteInvoice API call actually sets the status to VOID or soft deletes.
        // If it's a hard delete, the API or backend logic might need adjustment for "voiding".
        await deleteInvoice(invoiceId); // This might need to be an updateInvoice call to set status to 'VOID'
        fetchInvoices(); // Refresh the list
      } catch (err) {
        setError(err.message || 'Failed to void invoice.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading && invoices.length === 0) {
    return <div className="flex justify-center items-center p-10"><LoadingSpinner message="Loading invoices..." /></div>;
  }

  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{error}</div>;
  }

  if (!currentUser) {
    return <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">Please log in to view invoices.</div>;
  }

  if (invoices.length === 0) {
    return <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md">No invoices found.</div>;
  }

  const canManageInvoices = currentUser && (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
            {!forPatientId && currentUser.role !== USER_ROLES.PATIENT && (
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
            )}
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className={`hover:bg-gray-50 ${invoice.is_overdue && invoice.status !== 'PAID' && invoice.status !== 'VOID' ? 'bg-orange-50' : ''}`}>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
              {!forPatientId && currentUser.role !== USER_ROLES.PATIENT && (
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {invoice.patient_details?.user?.first_name} {invoice.patient_details?.user?.last_name}
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.issue_date)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.due_date)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(invoice.total_amount)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(invoice.paid_amount)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right font-semibold">{formatCurrency(invoice.amount_due)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${INVOICE_STATUS_CLASSES[invoice.status] || 'bg-gray-100 text-gray-800'}`}>
                  {capitalizeWords(invoice.status_display || invoice.status?.replace(/_/g, ' ')) || 'Unknown'}
                </span>
                {invoice.is_overdue && invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
                  <span className="ml-1 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 items-center">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" /> Overdue
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                <Link
                  to={`/billing/invoices/${invoice.id}`}
                  className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                  title="View Details"
                >
                  <EyeIcon className="h-4 w-4 mr-1" /> View
                </Link>
                {canManageInvoices && invoice.status !== 'VOID' && invoice.status !== 'PAID' && (
                  <button
                    onClick={() => handleVoidInvoice(invoice.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-900 inline-flex items-center disabled:opacity-50"
                    title="Void Invoice"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" /> Void
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;
