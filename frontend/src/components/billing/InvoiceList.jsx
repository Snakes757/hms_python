// src/components/billing/InvoiceList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { listInvoices, deleteInvoice } from '../../api/billing'; // Assuming deleteInvoice means void for non-admins
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';

const INVOICE_STATUS_CLASSES = {
  DRAFT: 'secondary',
  SENT: 'info',
  PAID: 'success',
  PARTIALLY_PAID: 'primary',
  VOID: 'dark',
  OVERDUE: 'danger',
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
      } else if (currentUser.role === 'PATIENT') {
        params.patient__user__id = currentUser.id;
      }
      // Admins/Receptionists see all by default if no patientId specified
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
    if (window.confirm('Are you sure you want to void this invoice? This action might be irreversible for paid/partially paid invoices without further steps.')) {
      setIsLoading(true);
      try {
        await deleteInvoice(invoiceId); // Backend's DELETE on invoice handles voiding logic
        fetchInvoices(); // Refresh list
      } catch (err) {
        setError(err.message || 'Failed to void invoice.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading && invoices.length === 0) {
    return <LoadingSpinner message="Loading invoices..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }
  
  if (!currentUser) {
    return <div className="alert alert-warning mt-3">Please log in to view invoices.</div>;
  }

  if (invoices.length === 0) {
    return <div className="alert alert-info mt-3">No invoices found.</div>;
  }

  const canManageInvoices = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST');

  return (
    <div className="mt-0"> {/* Adjusted margin */}
      <h4 className="mb-3">Invoices</h4>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-primary">
            <tr>
              <th>Invoice #</th>
              {!forPatientId && currentUser.role !== 'PATIENT' && <th>Patient</th>}
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Total Amount</th>
              <th>Paid Amount</th>
              <th>Amount Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className={invoice.is_overdue && invoice.status !== 'PAID' && invoice.status !== 'VOID' ? 'table-danger' : ''}>
                <td>{invoice.invoice_number}</td>
                {!forPatientId && currentUser.role !== 'PATIENT' && (
                  <td>{invoice.patient_details?.user?.first_name} {invoice.patient_details?.user?.last_name}</td>
                )}
                <td>{new Date(invoice.issue_date).toLocaleDateString()}</td>
                <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                <td>${parseFloat(invoice.total_amount).toFixed(2)}</td>
                <td>${parseFloat(invoice.paid_amount).toFixed(2)}</td>
                <td>${parseFloat(invoice.amount_due).toFixed(2)}</td>
                <td>
                  <span className={`badge bg-${INVOICE_STATUS_CLASSES[invoice.status] || 'secondary'}`}>
                    {invoice.status_display || invoice.status}
                  </span>
                  {invoice.is_overdue && invoice.status !== 'PAID' && invoice.status !== 'VOID' && <span className="badge bg-warning text-dark ms-1">Overdue</span>}
                </td>
                <td>
                  <Link to={`/billing/invoices/${invoice.id}`} className="btn btn-sm btn-outline-info me-2">
                    View
                  </Link>
                  {canManageInvoices && invoice.status !== 'VOID' && invoice.status !== 'PAID' && (
                    <button 
                      className="btn btn-sm btn-outline-warning" 
                      onClick={() => handleVoidInvoice(invoice.id)}
                      disabled={isLoading}
                    >
                      Void
                    </button>
                  )}
                  {/* Edit button for DRAFT invoices can be added */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceList;
