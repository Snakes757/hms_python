// src/components/medical/PrescriptionForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { createPrescription, updatePrescription, getPrescriptionDetail } from '../../api/prescriptions';
import { listAppointments } from '../../api/appointments'; // To link to an appointment
import { listMedicalRecordsForPatient } from '../../api/medicalRecords'; // To link to a medical record
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const PrescriptionForm = ({ patientUserId, prescriptionId, onFormSubmit, onCancel }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration_days: '',
    instructions: '',
    prescription_date: new Date().toISOString().split('T')[0], // Default to today
    is_active: true,
    appointment: '', // Optional appointment ID
    medical_record: '', // Optional medical record ID
  });

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(prescriptionId);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isEditing && prescriptionId) {
          const rxDetails = await getPrescriptionDetail(patientUserId, prescriptionId);
          setFormData({
            medication_name: rxDetails.medication_name || '',
            dosage: rxDetails.dosage || '',
            frequency: rxDetails.frequency || '',
            duration_days: rxDetails.duration_days || '',
            instructions: rxDetails.instructions || '',
            prescription_date: rxDetails.prescription_date ? new Date(rxDetails.prescription_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            is_active: rxDetails.is_active === undefined ? true : rxDetails.is_active,
            appointment: rxDetails.appointment || '', // This would be appointment ID
            medical_record: rxDetails.medical_record || '', // This would be medical record ID
          });
        }
        // Fetch appointments and medical records for linking (optional)
        // Only fetch if user is a doctor, as they are the ones creating/editing
        if (currentUser?.role === 'DOCTOR') {
            const apptParams = { patient__user__id: patientUserId, status: 'COMPLETED' }; // Example: link to completed appts
            const apptsData = await listAppointments(apptParams);
            setAppointments(apptsData || []);

            const medRecordsData = await listMedicalRecordsForPatient(patientUserId);
            setMedicalRecords(medRecordsData || []);
        }

      } catch (err) {
        setError("Failed to load data: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (patientUserId) { // Only fetch if patientUserId is available
        fetchData();
    }
  }, [patientUserId, prescriptionId, isEditing, currentUser?.role]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const payload = { ...formData };
    // Ensure empty strings for optional FKs are sent as null or omitted if backend expects that
    if (!payload.appointment) delete payload.appointment;
    if (!payload.medical_record) delete payload.medical_record;
    if (!payload.duration_days) delete payload.duration_days; // if it's truly optional and backend handles empty string as null


    try {
      if (isEditing) {
        await updatePrescription(patientUserId, prescriptionId, payload);
      } else {
        await createPrescription(patientUserId, payload);
      }
      onFormSubmit(); // Callback to refresh list or close modal
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} prescription.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !formData.medication_name && isEditing) { // More specific loading for edit mode
    return <LoadingSpinner message="Loading prescription details..." />;
  }
   if (isLoading && !isEditing && appointments.length === 0 && medicalRecords.length === 0 && currentUser?.role === 'DOCTOR') {
    return <LoadingSpinner message="Loading form data..." />;
  }


  return (
    <div className="card shadow-sm mb-4">
        <div className="card-header">
            <h5 className="mb-0">{isEditing ? 'Edit Prescription' : 'Add New Prescription'}</h5>
        </div>
        <div className="card-body">
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="medication_name" className="form-label">Medication Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" id="medication_name" name="medication_name" value={formData.medication_name} onChange={handleChange} required />
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="dosage" className="form-label">Dosage <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" id="dosage" name="dosage" value={formData.dosage} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="frequency" className="form-label">Frequency <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" id="frequency" name="frequency" value={formData.frequency} onChange={handleChange} required />
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="duration_days" className="form-label">Duration (days)</label>
                        <input type="number" className="form-control" id="duration_days" name="duration_days" value={formData.duration_days} onChange={handleChange} min="1" />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="prescription_date" className="form-label">Prescription Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="prescription_date" name="prescription_date" value={formData.prescription_date} onChange={handleChange} required />
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="instructions" className="form-label">Instructions</label>
                    <textarea className="form-control" id="instructions" name="instructions" rows="3" value={formData.instructions} onChange={handleChange}></textarea>
                </div>
                
                {currentUser?.role === 'DOCTOR' && (
                    <>
                        <div className="mb-3">
                            <label htmlFor="appointment" className="form-label">Link to Appointment (Optional)</label>
                            <select className="form-select" id="appointment" name="appointment" value={formData.appointment} onChange={handleChange}>
                                <option value="">None</option>
                                {appointments.map(appt => (
                                    <option key={appt.id} value={appt.id}>
                                        ID: {appt.id} - {new Date(appt.appointment_date_time).toLocaleDateString()} - {appt.reason?.substring(0,30) || appt.appointment_type_display}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="medical_record" className="form-label">Link to Medical Record (Optional)</label>
                            <select className="form-select" id="medical_record" name="medical_record" value={formData.medical_record} onChange={handleChange}>
                                <option value="">None</option>
                                {medicalRecords.map(mr => (
                                    <option key={mr.id} value={mr.id}>
                                        ID: {mr.id} - {new Date(mr.record_date).toLocaleDateString()} - {mr.diagnosis?.substring(0,30) || 'Record'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <div className="form-check mb-3">
                    <input className="form-check-input" type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="is_active">
                        Is Active
                    </label>
                </div>

                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={onCancel} disabled={isLoading}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Prescription' : 'Save Prescription')}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default PrescriptionForm;
