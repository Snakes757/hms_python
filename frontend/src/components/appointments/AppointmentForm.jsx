// src/components/appointments/AppointmentForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { createAppointment, updateAppointment, getAppointmentDetails, getActiveDoctors } from '../../api/appointments';
import { listAllPatients } from '../../api/patients'; // For staff to select a patient
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

// Based on backend models.py AppointmentType
const APPOINTMENT_TYPES = [
    { value: 'GENERAL_CONSULTATION', label: 'General Consultation' },
    { value: 'SPECIALIST_VISIT', label: 'Specialist Visit' },
    { value: 'FOLLOW_UP', label: 'Follow-up' },
    { value: 'TELEMEDICINE', label: 'Telemedicine' },
    { value: 'PROCEDURE', label: 'Procedure' },
    { value: 'CHECK_UP', label: 'Check-up' },
    { value: 'EMERGENCY', label: 'Emergency' },
];

// Based on backend models.py AppointmentStatus - for staff editing status
const APPOINTMENT_STATUS_CHOICES_STAFF = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'NO_SHOW', label: 'No Show' },
    { value: 'CANCELLED_BY_STAFF', label: 'Cancelled by Staff' },
    // RESCHEDULED is typically handled by creating a new appointment and linking
];


const AppointmentForm = ({ appointmentId }) => { // appointmentId for editing
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  // const { appointmentId } = useParams(); // Use prop instead for clarity if this form is embedded

  const [formData, setFormData] = useState({
    patient: '', // User ID of the patient
    doctor: '',  // User ID of the doctor
    appointment_type: APPOINTMENT_TYPES[0].value,
    appointment_date_time: new Date(new Date().setMinutes(0)).toISOString().slice(0, 16), // Default to next hour, on the hour
    estimated_duration_minutes: 30,
    status: 'SCHEDULED', // Default for new appointments
    reason: '',
    notes: '', // Internal notes by staff
  });

  const [patients, setPatients] = useState([]); // For staff to select patient
  const [doctors, setDoctors] = useState([]);   // For selecting doctor
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = Boolean(appointmentId);

  // Fetch doctors and patients (if staff)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const doctorsData = await getActiveDoctors();
        setDoctors(doctorsData || []);

        if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE')) {
          const patientsData = await listAllPatients();
          setPatients(patientsData || []);
        } else if (currentUser && currentUser.role === 'PATIENT') {
          // For patient, set their own ID and make patient field read-only or hidden
          setFormData(prev => ({ ...prev, patient: currentUser.id }));
        }

        if (isEditing) {
          const apptDetails = await getAppointmentDetails(appointmentId);
          setFormData({
            patient: apptDetails.patient_details.user.id, // Assuming patient_details.user.id
            doctor: apptDetails.doctor_details.id,     // Assuming doctor_details.id
            appointment_type: apptDetails.appointment_type,
            appointment_date_time: new Date(apptDetails.appointment_date_time).toISOString().slice(0, 16),
            estimated_duration_minutes: apptDetails.estimated_duration_minutes || 30,
            status: apptDetails.status,
            reason: apptDetails.reason || '',
            notes: apptDetails.notes || '',
          });
        }
      } catch (err) {
        setError("Failed to load initial data: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [currentUser, appointmentId, isEditing]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const payload = { ...formData };
    // Ensure IDs are numbers if needed by backend, though usually string PKs from forms are fine for Django REST
    payload.patient = parseInt(payload.patient, 10);
    payload.doctor = parseInt(payload.doctor, 10);
    payload.estimated_duration_minutes = parseInt(payload.estimated_duration_minutes, 10);

    try {
      if (isEditing) {
        await updateAppointment(appointmentId, payload);
        setSuccess('Appointment updated successfully!');
      } else {
        await createAppointment(payload);
        setSuccess('Appointment scheduled successfully!');
        // Reset form for new entry if not redirecting
        setFormData({
            patient: currentUser?.role === 'PATIENT' ? currentUser.id : '', 
            doctor: '', appointment_type: APPOINTMENT_TYPES[0].value,
            appointment_date_time: new Date(new Date().setMinutes(0)).toISOString().slice(0, 16),
            estimated_duration_minutes: 30, status: 'SCHEDULED', reason: '', notes: ''
        });
      }
      // Optionally navigate after success
      // navigate('/appointments'); 
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'schedule'} appointment.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !isEditing && doctors.length === 0) { // Show full page loading only on initial data fetch
    return <LoadingSpinner message={isEditing ? "Loading appointment details..." : "Loading form..."} />;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h4 className="mb-0">{isEditing ? 'Edit Appointment' : 'Schedule New Appointment'}</h4>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="alert">{success}</div>}
        <form onSubmit={handleSubmit}>
          {/* Patient Selection (for Staff) */}
          {currentUser && (currentUser.role !== 'PATIENT') && (
            <div className="mb-3">
              <label htmlFor="patient" className="form-label">Patient <span className="text-danger">*</span></label>
              <select 
                id="patient" 
                name="patient" 
                className="form-select" 
                value={formData.patient} 
                onChange={handleChange} 
                required
                disabled={patients.length === 0 || isLoading}
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.user.id} value={p.user.id}>
                    {p.user.first_name} {p.user.last_name} (ID: {p.user.id})
                  </option>
                ))}
              </select>
              {patients.length === 0 && !isLoading && <small className="form-text text-muted">Loading patients or no patients available.</small>}
            </div>
          )}
           {currentUser && currentUser.role === 'PATIENT' && (
             <input type="hidden" name="patient" value={formData.patient} />
           )}


          {/* Doctor Selection */}
          <div className="mb-3">
            <label htmlFor="doctor" className="form-label">Doctor <span className="text-danger">*</span></label>
            <select 
              id="doctor" 
              name="doctor" 
              className="form-select" 
              value={formData.doctor} 
              onChange={handleChange} 
              required
              disabled={doctors.length === 0 || isLoading}
            >
              <option value="">Select Doctor</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.first_name} {doc.last_name} ({doc.profile?.specialization || 'General'})
                </option>
              ))}
            </select>
            {doctors.length === 0 && !isLoading && <small className="form-text text-muted">Loading doctors or no doctors available.</small>}
          </div>

          {/* Appointment Type */}
          <div className="mb-3">
            <label htmlFor="appointment_type" className="form-label">Appointment Type <span className="text-danger">*</span></label>
            <select id="appointment_type" name="appointment_type" className="form-select" value={formData.appointment_type} onChange={handleChange} required>
              {APPOINTMENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="mb-3">
            <label htmlFor="appointment_date_time" className="form-label">Date and Time <span className="text-danger">*</span></label>
            <input 
              type="datetime-local" 
              className="form-control" 
              id="appointment_date_time" 
              name="appointment_date_time" 
              value={formData.appointment_date_time} 
              onChange={handleChange} 
              required 
            />
          </div>

          {/* Estimated Duration */}
          <div className="mb-3">
            <label htmlFor="estimated_duration_minutes" className="form-label">Estimated Duration (minutes)</label>
            <input 
              type="number" 
              className="form-control" 
              id="estimated_duration_minutes" 
              name="estimated_duration_minutes" 
              value={formData.estimated_duration_minutes} 
              onChange={handleChange} 
              min="5" 
              step="5"
            />
          </div>
          
          {/* Status (only for staff editing) */}
          {isEditing && currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'DOCTOR') && (
            <div className="mb-3">
                <label htmlFor="status" className="form-label">Status</label>
                <select id="status" name="status" className="form-select" value={formData.status} onChange={handleChange}>
                    {APPOINTMENT_STATUS_CHOICES_STAFF.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>
          )}


          {/* Reason for Appointment */}
          <div className="mb-3">
            <label htmlFor="reason" className="form-label">Reason for Appointment</label>
            <textarea className="form-control" id="reason" name="reason" rows="3" value={formData.reason} onChange={handleChange}></textarea>
          </div>

          {/* Notes (for staff) */}
          {currentUser && (currentUser.role !== 'PATIENT') && (
            <div className="mb-3">
              <label htmlFor="notes" className="form-label">Internal Notes</label>
              <textarea className="form-control" id="notes" name="notes" rows="3" value={formData.notes} onChange={handleChange}></textarea>
            </div>
          )}

          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-outline-secondary me-2" onClick={() => navigate(isEditing ? `/appointments/${appointmentId}` : '/appointments')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (isEditing ? 'Updating...' : 'Scheduling...') : (isEditing ? 'Update Appointment' : 'Schedule Appointment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
