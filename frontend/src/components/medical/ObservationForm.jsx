// src/components/medical/ObservationForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { createObservation, updateObservation, getObservationDetail } from '../../api/observations';
import { listAppointments } from '../../api/appointments';
import { listMedicalRecordsForPatient } from '../../api/medicalRecords';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ObservationForm = ({ patientUserId, observationId, onFormSubmit, onCancel }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    observation_date_time: new Date().toISOString().slice(0, 16), // Default to now
    symptoms_observed: '',
    vital_signs: '', // Store as JSON string in form, parse/stringify on submit/load
    description: '',
    notes: '',
    appointment: '', 
    medical_record: '', 
  });

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(observationId);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isEditing && observationId) {
          const obsDetails = await getObservationDetail(patientUserId, observationId);
          setFormData({
            observation_date_time: obsDetails.observation_date_time ? new Date(obsDetails.observation_date_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            symptoms_observed: obsDetails.symptoms_observed || '',
            vital_signs: obsDetails.vital_signs ? JSON.stringify(obsDetails.vital_signs, null, 2) : '', // Pretty print if object
            description: obsDetails.description || '',
            notes: obsDetails.notes || '',
            appointment: obsDetails.appointment || '',
            medical_record: obsDetails.medical_record || '',
          });
        }
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
  }, [patientUserId, observationId, isEditing, currentUser?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    let payload = { ...formData };
    // Parse vital_signs JSON string before sending
    if (payload.vital_signs) {
      try {
        payload.vital_signs = JSON.parse(payload.vital_signs);
      } catch (jsonError) {
        setError("Invalid JSON format for Vital Signs. Please correct it or leave it empty.");
        setIsLoading(false);
        return;
      }
    } else {
        delete payload.vital_signs; // Send null or omit if empty, backend dependent
    }

    if (!payload.appointment) delete payload.appointment;
    if (!payload.medical_record) delete payload.medical_record;
    
    // Ensure at least one observation field is filled
    if (!payload.symptoms_observed && !payload.description && !payload.vital_signs) {
        setError("At least one of symptoms, description, or vital signs must be provided.");
        setIsLoading(false);
        return;
    }

    try {
      if (isEditing) {
        await updateObservation(patientUserId, observationId, payload);
      } else {
        await createObservation(patientUserId, payload);
      }
      onFormSubmit(); 
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} observation.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !formData.description && isEditing) { 
    return <LoadingSpinner message="Loading observation details..." />;
  }
   if (isLoading && !isEditing && appointments.length === 0 && medicalRecords.length === 0 && (currentUser?.role === 'DOCTOR' || currentUser?.role === 'NURSE')) {
    return <LoadingSpinner message="Loading form data..." />;
  }

  return (
    <div className="card shadow-sm mb-4">
        <div className="card-header">
            <h5 className="mb-0">{isEditing ? 'Edit Observation' : 'Add New Observation'}</h5>
        </div>
        <div className="card-body">
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="observation_date_time" className="form-label">Observation Date & Time <span className="text-danger">*</span></label>
                    <input type="datetime-local" className="form-control" id="observation_date_time" name="observation_date_time" value={formData.observation_date_time} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="symptoms_observed" className="form-label">Symptoms Observed</label>
                    <textarea className="form-control" id="symptoms_observed" name="symptoms_observed" rows="2" value={formData.symptoms_observed} onChange={handleChange}></textarea>
                </div>
                <div className="mb-3">
                    <label htmlFor="vital_signs" className="form-label">Vital Signs (JSON format)</label>
                    <textarea className="form-control" id="vital_signs" name="vital_signs" rows="3" value={formData.vital_signs} onChange={handleChange} placeholder='e.g., {"temperature": "37C", "bp": "120/80"}'></textarea>
                    <small className="form-text text-muted">Enter as a valid JSON object, or leave blank.</small>
                </div>
                <div className="mb-3">
                    <label htmlFor="description" className="form-label">Detailed Description</label>
                    <textarea className="form-control" id="description" name="description" rows="3" value={formData.description} onChange={handleChange}></textarea>
                </div>
                <div className="mb-3">
                    <label htmlFor="notes" className="form-label">Additional Notes</label>
                    <textarea className="form-control" id="notes" name="notes" rows="2" value={formData.notes} onChange={handleChange}></textarea>
                </div>

                {currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE') && (
                    <>
                        <div className="mb-3">
                            <label htmlFor="obs_appointment" className="form-label">Link to Appointment (Optional)</label>
                            <select className="form-select" id="obs_appointment" name="appointment" value={formData.appointment} onChange={handleChange}>
                                <option value="">None</option>
                                {appointments.map(appt => (
                                    <option key={appt.id} value={appt.id}>
                                        ID: {appt.id} - {new Date(appt.appointment_date_time).toLocaleDateString()} - {appt.reason?.substring(0,30) || appt.appointment_type_display}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="obs_medical_record" className="form-label">Link to Medical Record (Optional)</label>
                            <select className="form-select" id="obs_medical_record" name="medical_record" value={formData.medical_record} onChange={handleChange}>
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
                        {isLoading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Observation' : 'Save Observation')}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default ObservationForm;
