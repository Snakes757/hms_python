// src/components/billing/InvoiceForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { createInvoice, updateInvoice, getInvoiceDetails } from '../../api/billing';
import { listAllPatients } from '../../api/patients'; // To select patient
import { listAppointments } // To link items to appointments
from '../../api/appointments'; 
// Import APIs for treatments and prescriptions if you want to link them directly
// import { listTreatmentsForPatient } from '../../api/treatments';
// import { listPrescriptionsForPatient } from '../../api/prescriptions';

import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

const INVOICE_STATUS_CHOICES_STAFF = [ // For staff editing status of existing invoice
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SENT', label: 'Sent' },
    // PAID, PARTIALLY_PAID are usually set by payments
    // VOID is handled by delete/void action
];


const InvoiceForm = ({ invoiceId }) => { // invoiceId for editing
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    patient: '', // Patient User ID
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Default 30 days due
    status: 'DRAFT', // Default for new invoices
    notes: '',
    items: [{ description: '', quantity: 1, unit_price: '0.00', appointment: '', treatment: '', prescription: '' }],
  });

  const [patients, setPatients] = useState([]);
  const [appointmentsForPatient, setAppointmentsForPatient] = useState([]);
  // Add states for treatments and prescriptions if linking them
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = Boolean(invoiceId);

  // Fetch patients for selection
  useEffect(() => {
    const loadPatients = async () => {
      if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST')) {
        setIsLoading(true);
        try {
          const patientsData = await listAllPatients();
          setPatients(patientsData || []);
        } catch (err) {
          setError("Failed to load patients: " + err.message);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadPatients();
  }, [currentUser]);

  // Fetch appointments for the selected patient (if a patient is selected)
  useEffect(() => {
    const loadAppointments = async () => {
      if (formData.patient) {
        // setIsLoading(true); // Potentially set loading for appointments specifically
        try {
          // Fetch appointments for the selected patient (formData.patient is user ID)
          // You might want to filter these, e.g., only completed appointments
          const apptsData = await listAppointments({ patient__user__id: formData.patient, status: 'COMPLETED' });
          setAppointmentsForPatient(apptsData || []);
        } catch (err) {
          console.error("Failed to load appointments for patient:", err.message);
          setAppointmentsForPatient([]); // Clear if error
        } finally {
          // setIsLoading(false);
        }
      } else {
        setAppointmentsForPatient([]); // Clear if no patient selected
      }
    };
    loadAppointments();
  }, [formData.patient]);


  // Fetch invoice details if editing
  useEffect(() => {
    if (isEditing && invoiceId) {
      setIsLoading(true);
      getInvoiceDetails(invoiceId)
        .then(data => {
          setFormData({
            patient: data.patient_details.user.id,
            issue_date: data.issue_date,
            due_date: data.due_date,
            status: data.status,
            notes: data.notes || '',
            items: data.items.map(item => ({
                id: item.id, // Keep original item ID for updates if backend supports item-level PUT/PATCH
                description: item.description,
                quantity: item.quantity,
                unit_price: parseFloat(item.unit_price).toFixed(2),
                appointment: item.appointment || '', // This is appointment ID
                treatment: item.treatment || '', // Placeholder
                prescription: item.prescription || '', // Placeholder
            })) || [{ description: '', quantity: 1, unit_price: '0.00', appointment: '' }],
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
      items: [...prev.items, { description: '', quantity: 1, unit_price: '0.00', appointment: '' }],
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
        ...item,
        quantity: parseInt(item.quantity, 10),
        unit_price: parseFloat(item.unit_price).toFixed(2),
        appointment: item.appointment ? parseInt(item.appointment, 10) : null,
        // treatment: item.treatment ? parseInt(item.treatment, 10) : null, // Add if implemented
        // prescription: item.prescription ? parseInt(item.prescription, 10) : null, // Add if implemented
      })).filter(item => item.description && item.quantity > 0 && parseFloat(item.unit_price) >= 0) // Basic validation
    };
    
    if (payload.items.length === 0) {
        setError("Invoice must have at least one valid item.");
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
        // Reset form for new entry
        setFormData({
          patient: '', issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
          status: 'DRAFT', notes: '',
          items: [{ description: '', quantity: 1, unit_price: '0.00', appointment: '' }],
        });
      }
      // navigate('/billing/invoices'); 
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} invoice.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !isEditing && patients.length === 0) {
    return <LoadingSpinner message={isEditing ? "Loading invoice..." : "Loading form..."} />;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h4 className="mb-0">{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</h4>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="alert">{success}</div>}
        <form onSubmit={handleSubmit}>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label htmlFor="patient" className="form-label">Patient <span className="text-danger">*</span></label>
                    <select id="patient" name="patient" className="form-select" value={formData.patient} onChange={handleChange} required disabled={patients.length === 0 || isLoading}>
                        <option value="">Select Patient</option>
                        {patients.map(p => (
                        <option key={p.user.id} value={p.user.id}>
                            {p.user.first_name} {p.user.last_name} (ID: {p.user.id})
                        </option>
                        ))}
                    </select>
                </div>
                 <div className="col-md-6 mb-3">
                    <label htmlFor="status" className="form-label">Status</label>
                    <select id="status" name="status" className="form-select" value={formData.status} onChange={handleChange} disabled={!isEditing && formData.status !== 'DRAFT'}>
                        {INVOICE_STATUS_CHOICES_STAFF.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label htmlFor="issue_date" className="form-label">Issue Date <span className="text-danger">*</span></label>
                    <input type="date" className="form-control" id="issue_date" name="issue_date" value={formData.issue_date} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                    <label htmlFor="due_date" className="form-label">Due Date <span className="text-danger">*</span></label>
                    <input type="date" className="form-control" id="due_date" name="due_date" value={formData.due_date} onChange={handleChange} required />
                </div>
            </div>
            
            <hr/>
            <h5>Invoice Items</h5>
            {formData.items.map((item, index) => (
                <div key={index} className="row align-items-center mb-2 p-2 border rounded">
                    <div className="col-md-4 mb-2">
                        <label htmlFor={`item_description_${index}`} className="form-label">Description <span className="text-danger">*</span></label>
                        <input type="text" className="form-control form-control-sm" id={`item_description_${index}`} name="description" value={item.description} onChange={(e) => handleItemChange(index, e)} required />
                    </div>
                    <div className="col-md-2 mb-2">
                        <label htmlFor={`item_quantity_${index}`} className="form-label">Quantity <span className="text-danger">*</span></label>
                        <input type="number" className="form-control form-control-sm" id={`item_quantity_${index}`} name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} min="1" required />
                    </div>
                    <div className="col-md-2 mb-2">
                        <label htmlFor={`item_unit_price_${index}`} className="form-label">Unit Price <span className="text-danger">*</span></label>
                        <input type="number" className="form-control form-control-sm" id={`item_unit_price_${index}`} name="unit_price" value={item.unit_price} onChange={(e) => handleItemChange(index, e)} min="0.00" step="0.01" required />
                    </div>
                    <div className="col-md-3 mb-2">
                        <label htmlFor={`item_appointment_${index}`} className="form-label">Link Appointment (Optional)</label>
                        <select className="form-select form-select-sm" id={`item_appointment_${index}`} name="appointment" value={item.appointment} onChange={(e) => handleItemChange(index, e)} disabled={appointmentsForPatient.length === 0}>
                            <option value="">None</option>
                            {appointmentsForPatient.map(appt => (
                                <option key={appt.id} value={appt.id}>Appt ID: {appt.id} ({new Date(appt.appointment_date_time).toLocaleDateString()})</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-1 mb-2 d-flex align-items-end">
                        {formData.items.length > 1 && (
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(index)}>X</button>
                        )}
                    </div>
                </div>
            ))}
            <button type="button" className="btn btn-outline-success btn-sm mb-3" onClick={addItem}>Add Item</button>

            <hr/>
            <div className="mb-3">
                <label htmlFor="notes" className="form-label">Notes</label>
                <textarea className="form-control" id="notes" name="notes" rows="3" value={formData.notes} onChange={handleChange}></textarea>
            </div>

          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-outline-secondary me-2" onClick={() => navigate('/billing/invoices')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Invoice' : 'Create Invoice')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
