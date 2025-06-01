// src/components/billing/PaymentForm.jsx
import React, { useState, useContext } from 'react';
import { recordPayment } from '../../api/billing';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

// Based on backend models.py PaymentMethod
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'INSURANCE', label: 'Insurance Claim' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'OTHER', label: 'Other' },
];

const PaymentForm = ({ invoiceId, currentAmountDue, onPaymentRecorded, onCancel }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    amount: currentAmountDue > 0 ? currentAmountDue.toFixed(2) : '0.00', // Default to amount due or 0
    payment_method: PAYMENT_METHODS[0].value,
    payment_date: new Date().toISOString().slice(0, 16), // datetime-local format
    transaction_id: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount).toFixed(2),
    };

    if (parseFloat(payload.amount) <= 0) {
        setError("Payment amount must be positive.");
        setIsLoading(false);
        return;
    }
    if (parseFloat(payload.amount) > currentAmountDue) {
        setError(`Payment amount ($${payload.amount}) cannot exceed amount due ($${currentAmountDue.toFixed(2)}).`);
        setIsLoading(false);
        return;
    }


    try {
      await recordPayment(invoiceId, payload);
      onPaymentRecorded(); // Callback to refresh parent component (InvoiceDetails)
    } catch (err) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'RECEPTIONIST')) {
      return <p className="text-danger">You are not authorized to record payments.</p>;
  }


  return (
    <div className="card shadow-sm my-4">
        <div className="card-header bg-light">
            <h5 className="mb-0">Record New Payment</h5>
        </div>
        <div className="card-body">
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="payment_amount" className="form-label">Amount <span className="text-danger">*</span></label>
                        <input 
                            type="number" 
                            className="form-control" 
                            id="payment_amount" 
                            name="amount" 
                            value={formData.amount} 
                            onChange={handleChange} 
                            required 
                            min="0.01" 
                            step="0.01"
                            max={currentAmountDue.toFixed(2)}
                        />
                         <small className="form-text text-muted">Amount Due: ${currentAmountDue.toFixed(2)}</small>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="payment_method" className="form-label">Payment Method <span className="text-danger">*</span></label>
                        <select 
                            id="payment_method" 
                            name="payment_method" 
                            className="form-select" 
                            value={formData.payment_method} 
                            onChange={handleChange} 
                            required
                        >
                            {PAYMENT_METHODS.map(method => (
                                <option key={method.value} value={method.value}>{method.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="payment_date" className="form-label">Payment Date & Time <span className="text-danger">*</span></label>
                    <input 
                        type="datetime-local" 
                        className="form-control" 
                        id="payment_date" 
                        name="payment_date" 
                        value={formData.payment_date} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="transaction_id" className="form-label">Transaction ID/Reference</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        id="transaction_id" 
                        name="transaction_id" 
                        value={formData.transaction_id} 
                        onChange={handleChange} 
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="payment_notes" className="form-label">Notes</label>
                    <textarea 
                        className="form-control" 
                        id="payment_notes" 
                        name="notes" 
                        rows="2" 
                        value={formData.notes} 
                        onChange={handleChange}
                    ></textarea>
                </div>
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-outline-secondary me-2" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-success" disabled={isLoading}>
                        {isLoading ? <LoadingSpinner message="Recording..." /> : 'Record Payment'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default PaymentForm;
