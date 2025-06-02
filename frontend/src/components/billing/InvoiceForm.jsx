import React, { useState, useEffect, useContext } from 'react';
import { createInvoice, updateInvoice, getInvoiceDetails } from '../../api/billing';
import { listAllPatients } from '../../api/patients';
import { listAppointments } from '../../api/appointments'; // Assuming this is for linking items
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import { USER_ROLES } from '../../utils/constants';
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

const INVOICE_STATUS_CHOICES_STAFF = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SENT', label: 'Sent' },
    // Other statuses like PAID, VOID are typically managed by system actions, not direct form selection.
];

const InvoiceForm = ({ invoiceId }) => {
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const initialItem = { description: '', quantity: 1, unit_price: '0.00', appointment: '' };
  const [formData, setFormData] = useState({
    patient: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Default due date 30 days from now
    status: 'DRAFT',
    notes: '',
    items: [initialItem],
  });

  const [patients, setPatients] = useState([]);
  const [appointmentsForPatient, setAppointmentsForPatient] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = Boolean(invoiceId);

  // Fetch patients (for Admin/Receptionist)
  useEffect(() => {
    const loadPatients = async () => {
      if (currentUser && (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST)) {
        setIsLoading(true);
        try {
          const patientsData = await listAllPatients();
          setPatients(patientsData?.results || patientsData || []);
        } catch (err) {
          setError("Failed to load patients: " + err.message);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadPatients();
  }, [currentUser]);

  // Fetch appointments for the selected patient (optional for linking items)
  useEffect(() => {
    const loadAppointments = async () => {
      if (formData.patient) {
        // Fetch only relevant appointments, e.g., completed or billable
        try {
          const apptsData = await listAppointments({ patient__user__id: formData.patient, status: 'COMPLETED' }); // Example filter
          setAppointmentsForPatient(apptsData || []);
        } catch (err) {
          console.error("Failed to load appointments for patient:", err.message);
          setAppointmentsForPatient([]);
        }
      } else {
        setAppointmentsForPatient([]);
      }
    };
    loadAppointments();
  }, [formData.patient]);

  // Load existing invoice data if editing
  useEffect(() => {
    if (isEditing && invoiceId) {
      setIsLoading(true);
      getInvoiceDetails(invoiceId)
        .then(data => {
          setFormData({
            patient: data.patient_details?.user?.id.toString() || '',
            issue_date: data.issue_date,
            due_date: data.due_date,
            status: data.status,
            notes: data.notes || '',
            items: data.items.map(item => ({
                id: item.id, // Keep original ID for updates
                description: item.description,
                quantity: item.quantity,
                unit_price: parseFloat(item.unit_price).toFixed(2),
                appointment: item.appointment || '', // Assuming appointment is an ID
            })) || [initialItem],
          });
        })
        .catch(err => setError("Failed to load invoice details: " + err.message))
        .finally(() => setIsLoading(false));
    }
  }, [invoiceId, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const items = [...formData.items];
    items[index][name] = value;
    setFormData(prev => ({ ...prev, items }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...initialItem }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return; // Keep at least one item
    const items = [...formData.items];
    items.splice(index, 1);
    setFormData(prev => ({ ...prev, items }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      ...formData,
      patient: parseInt(formData.patient, 10),
      items: formData.items.map(item => ({
        ...(item.id && { id: item.id }), // Include item ID if it exists (for updates)
        description: item.description,
        quantity: parseInt(item.quantity, 10),
        unit_price: parseFloat(item.unit_price).toFixed(2),
        appointment: item.appointment ? parseInt(item.appointment, 10) : null,
      })).filter(item => item.description && item.quantity > 0 && parseFloat(item.unit_price) >= 0) // Basic validation
    };

    if (payload.items.length === 0) {
        setError("Invoice must have at least one valid item.");
        setIsLoading(false);
        return;
    }
    if (!payload.patient) {
        setError("A patient must be selected.");
        setIsLoading(false);
        return;
    }


    try {
      if (isEditing) {
        await updateInvoice(invoiceId, payload);
        setSuccess('Invoice updated successfully!');
      } else {
        await createInvoice(payload);
        setSuccess('Invoice created successfully!');
        setFormData({ // Reset form after creation
          patient: '', issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
          status: 'DRAFT', notes: '', items: [initialItem],
        });
      }
      // Optionally navigate or refresh data after success
      // navigate('/billing/invoices');
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} invoice.`);
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const labelBaseClasses = "block text-sm font-medium text-gray-700";

  if (isLoading && !isEditing && patients.length === 0 && (currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.RECEPTIONIST)) {
    return <div className="flex justify-center items-center p-10"><LoadingSpinner message={isEditing ? "Loading invoice..." : "Loading form..."} /></div>;
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      {error && <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md text-sm">{success}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="patient" className={labelBaseClasses}>Patient <span className="text-red-500">*</span></label>
            <select id="patient" name="patient" className={inputBaseClasses} value={formData.patient} onChange={handleChange} required disabled={patients.length === 0 || isLoading}>
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.user.id} value={p.user.id.toString()}>
                  {p.user.first_name} {p.user.last_name} (ID: {p.user.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelBaseClasses}>Status</label>
            <select id="status" name="status" className={inputBaseClasses} value={formData.status} onChange={handleChange} disabled={!isEditing && formData.status !== 'DRAFT'}>
              {INVOICE_STATUS_CHOICES_STAFF.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="issue_date" className={labelBaseClasses}>Issue Date <span className="text-red-500">*</span></label>
            <input type="date" className={inputBaseClasses} id="issue_date" name="issue_date" value={formData.issue_date} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="due_date" className={labelBaseClasses}>Due Date <span className="text-red-500">*</span></label>
            <input type="date" className={inputBaseClasses} id="due_date" name="due_date" value={formData.due_date} onChange={handleChange} required />
          </div>
        </div>

        <hr className="my-6"/>
        <h4 className="text-lg font-medium text-gray-900">Invoice Items</h4>
        {formData.items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-x-4 gap-y-2 items-end p-3 border border-gray-200 rounded-md relative">
            <div className="col-span-12 sm:col-span-4">
              <label htmlFor={`item_description_${index}`} className={`${labelBaseClasses} text-xs`}>Description <span className="text-red-500">*</span></label>
              <input type="text" className={`${inputBaseClasses} py-1.5 text-sm`} id={`item_description_${index}`} name="description" value={item.description} onChange={(e) => handleItemChange(index, e)} required />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <label htmlFor={`item_quantity_${index}`} className={`${labelBaseClasses} text-xs`}>Qty <span className="text-red-500">*</span></label>
              <input type="number" className={`${inputBaseClasses} py-1.5 text-sm`} id={`item_quantity_${index}`} name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} min="1" required />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <label htmlFor={`item_unit_price_${index}`} className={`${labelBaseClasses} text-xs`}>Unit Price <span className="text-red-500">*</span></label>
              <input type="number" className={`${inputBaseClasses} py-1.5 text-sm`} id={`item_unit_price_${index}`} name="unit_price" value={item.unit_price} onChange={(e) => handleItemChange(index, e)} min="0.00" step="0.01" required />
            </div>
            <div className="col-span-10 sm:col-span-3">
              <label htmlFor={`item_appointment_${index}`} className={`${labelBaseClasses} text-xs`}>Link Appointment (Optional)</label>
              <select className={`${inputBaseClasses} py-1.5 text-sm`} id={`item_appointment_${index}`} name="appointment" value={item.appointment} onChange={(e) => handleItemChange(index, e)} disabled={appointmentsForPatient.length === 0}>
                <option value="">None</option>
                {appointmentsForPatient.map(appt => (
                  <option key={appt.id} value={appt.id.toString()}>
                    Appt ID: {appt.id} ({new Date(appt.appointment_date_time).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1 flex justify-end">
              {formData.items.length > 1 && (
                <button type="button" className="p-1.5 text-red-500 hover:text-red-700" onClick={() => removeItem(index)} title="Remove Item">
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ))}
        <button type="button" className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700" onClick={addItem}>
          <PlusCircleIcon className="h-5 w-5 mr-2" /> Add Item
        </button>

        <hr className="my-6"/>
        <div>
          <label htmlFor="notes" className={labelBaseClasses}>Notes</label>
          <textarea className={`${inputBaseClasses} min-h-[80px]`} id="notes" name="notes" value={formData.notes} onChange={handleChange}></textarea>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={() => navigate('/billing/invoices')}>
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : (isEditing ? 'Update Invoice' : 'Create Invoice')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
