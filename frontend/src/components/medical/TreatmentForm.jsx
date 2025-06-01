// src/components/medical/TreatmentForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { createTreatment, updateTreatment, getTreatmentDetail } from '../../api/treatments';
import { listAppointments } from '../../api/appointments';
import { listMedicalRecordsForPatient } from '../../api/medicalRecords';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const TreatmentForm = ({ patientUserId, treatmentId, onFormSubmit, onCancel }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    treatment_name: '',
    treatment_date_time: new Date().toISOString().slice(0, 16), // Default to now
    description: '',
    outcome: '',
    notes: '',
    appointment: '', // Optional appointment ID
    medical_record: '', // Optional medical record ID
  });

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(treatmentId);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isEditing && treatmentId) {
          const txDetails = await getTreatmentDetail(patientUserId, treatmentId);
          setFormData({
            treatment_name: txDetails.treatment_name || '',
            treatment_date_time: txDetails.treatment_date_time ? new Date(txDetails.treatment_date_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            description: txDetails.description || '',
            outcome: txDetails.outcome || '',
            notes: txDetails.notes || '',
            appointment: txDetails.appointment || '',
            medical_record: txDetails.medical_record || '',
          });
        }
         // Fetch appointments and medical records for linking (optional)
        // Accessible by Doctor or Nurse
        if (currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE')) {
            const apptParams = { patient__user__id: patientUserId, status: 'COMPLETED' }; 
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

    if (patientUserId) {
        fetchData();
    }
  }, [patientUserId, treatmentId, isEditing, currentUser?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const payload = { ...formData };
    if (!payload.appointment) delete payload.appointment;
    if (!payload.medical_record) delete payload.medical_record;

    try {
      if (isEditing) {
        await updateTreatment(patientUserId, treatmentId, payload);
      } else {
        await createTreatment(patientUserId, payload);
      }
      onFormSubmit(); // Callback to refresh or close
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} treatment.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !formData.treatment_name && isEditing) {
    return <LoadingSpinner message="Loading treatment details..." />;
  }
  if (isLoading && !isEditing && appointments.length === 0 && medicalRecords.length === 0 && (currentUser?.role === 'DOCTOR' || currentUser?.role === 'NURSE')) {
    return <LoadingSpinner message="Loading form data..." />;
  }

  return (
    <div className="card shadow-sm mb-4">
        <div className="card-header">
            <h5 className="mb-0">{isEditing ? 'Edit Treatment Record' : 'Add New Treatment Record'}</h5>
        </div>
        <div className="card-body">
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="treatment_name" className="form-label">Treatment Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" id="treatment_name" name="treatment_name" value={formData.treatment_name} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="treatment_date_time" className="form-label">Treatment Date & Time <span className="text-danger">*</span></label>
                    <input type="datetime-local" className="form-control" id="treatment_date_time" name="treatment_date_time" value={formData.treatment_date_time} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea className="form-control" id="description" name="description" rows="3" value={formData.description} onChange={handleChange}></textarea>
                </div>
                <div className="mb-3">
                    <label htmlFor="outcome" className="form-label">Outcome</label>
                    <textarea className="form-control" id="outcome" name="outcome" rows="2" value={formData.outcome} onChange={handleChange}></textarea>
                </div>
                <div className="mb-3">
                    <label htmlFor="notes" className="form-label">Additional Notes</label>
                    <textarea className="form-control" id="notes" name="notes" rows="2" value={formData.notes} onChange={handleChange}></textarea>
                </div>

                {currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE') && (
                    <>
                        <div className="mb-3">
                            <label htmlFor="tx_appointment" className="form-label">Link to Appointment (Optional)</label>
                            <select className="form-select" id="tx_appointment" name="appointment" value={formData.appointment} onChange={handleChange}>
                                <option value="">None</option>
                                {appointments.map(appt => (
                                    <option key={appt.id} value={appt.id}>
                                        ID: {appt.id} - {new Date(appt.appointment_date_time).toLocaleDateString()} - {appt.reason?.substring(0,30) || appt.appointment_type_display}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="tx_medical_record" className="form-label">Link to Medical Record (Optional)</label>
                            <select className="form-select" id="tx_medical_record" name="medical_record" value={formData.medical_record} onChange={handleChange}>
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

                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={onCancel} disabled={isLoading}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Treatment' : 'Save Treatment')}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default TreatmentForm;
