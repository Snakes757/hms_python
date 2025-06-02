import React, { useState, useContext } from 'react';
import { recordPayment } from '../../api/billing';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { USER_ROLES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

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
    amount: currentAmountDue > 0 ? currentAmountDue.toFixed(2) : '0.00',
    payment_method: PAYMENT_METHODS[0].value,
    payment_date: new Date().toISOString().slice(0, 16), // Format for datetime-local
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
    // Ensure payment does not exceed currentAmountDue; allow for partial payments.
    if (parseFloat(payload.amount) > parseFloat(currentAmountDue.toFixed(2))) {
        setError(`Payment amount (${formatCurrency(payload.amount)}) cannot exceed amount due (${formatCurrency(currentAmountDue)}).`);
        setIsLoading(false);
        return;
    }

    try {
      await recordPayment(invoiceId, payload);
      onPaymentRecorded(); // Callback to parent component
    } catch (err) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputBaseClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const labelBaseClasses = "block text-sm font-medium text-gray-700";

  if (!currentUser || (currentUser.role !== USER_ROLES.ADMIN && currentUser.role !== USER_ROLES.RECEPTIONIST)) {
      return <p className="text-red-500 text-sm">You are not authorized to record payments.</p>;
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-md my-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Record New Payment</h4>
        {error && <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="payment_amount" className={labelBaseClasses}>Amount <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        className={inputBaseClasses}
                        id="payment_amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        min="0.01"
                        step="0.01"
                        max={currentAmountDue.toFixed(2)}
                    />
                    <p className="mt-1 text-xs text-gray-500">Amount Due: {formatCurrency(currentAmountDue)}</p>
                </div>
                <div>
                    <label htmlFor="payment_method" className={labelBaseClasses}>Payment Method <span className="text-red-500">*</span></label>
                    <select
                        id="payment_method"
                        name="payment_method"
                        className={inputBaseClasses}
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
            <div>
                <label htmlFor="payment_date" className={labelBaseClasses}>Payment Date & Time <span className="text-red-500">*</span></label>
                <input
                    type="datetime-local"
                    className={inputBaseClasses}
                    id="payment_date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <label htmlFor="transaction_id" className={labelBaseClasses}>Transaction ID/Reference</label>
                <input
                    type="text"
                    className={inputBaseClasses}
                    id="transaction_id"
                    name="transaction_id"
                    value={formData.transaction_id}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="payment_notes" className={labelBaseClasses}>Notes</label>
                <textarea
                    className={`${inputBaseClasses} min-h-[60px]`}
                    id="payment_notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                ></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </button>
                <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Record Payment'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default PaymentForm;
