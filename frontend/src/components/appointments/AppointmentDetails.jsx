// src/components/appointments/AppointmentDetails.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate }  from 'react-router-dom';
import { getAppointmentDetails, updateAppointment, deleteAppointment } from '../../api/appointments';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

// Based on backend models.py
const APPOINTMENT_STATUSES = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  CANCELLED_BY_PATIENT: 'Cancelled by Patient',
  CANCELLED_BY_STAFF: 'Cancelled by Staff',
  COMPLETED: 'Completed',
  NO_SHOW: 'No Show',
  RESCHEDULED: 'Rescheduled',
};

const AppointmentDetails = ({ appointmentId: propAppointmentId }) => {
  const { appointmentId: paramAppointmentId } = useParams();
  const appointmentId = propAppointmentId || paramAppointmentId;

  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchAppointment = async () => {
    if (!appointmentId) {
        setError("Appointment ID is missing.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const data = await getAppointmentDetails(appointmentId);
      setAppointment(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch appointment details.');
      console.error("Error fetching appointment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to update the status to "${APPOINTMENT_STATUSES[newStatus] || newStatus}"?`)) return;
    setIsLoading(true);
    try {
        const updatedAppointment = await updateAppointment(appointmentId, { status: newStatus });
        setAppointment(updatedAppointment); // Refresh data
        setError(''); // Clear previous errors
    } catch (err) {
        setError(err.message || "Failed to update appointment status.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleCancelAppointment = async (byStaff = false) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel this appointment?`);
    if (!confirmCancel) return;

    setIsLoading(true);
    try {
      const statusToSet = byStaff ? 'CANCELLED_BY_STAFF' : 'CANCELLED_BY_PATIENT';
      const updatedData = await updateAppointment(appointmentId, { status: statusToSet });
      setAppointment(updatedData); 
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAppointmentAdmin = async () => {
    const confirmDelete = window.confirm("ADMIN ACTION: Are you sure you want to permanently delete this appointment? This cannot be undone.");
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
        await deleteAppointment(appointmentId); 
        setError('');
        navigate('/appointments', { replace: true, state: { message: 'Appointment deleted successfully.' } });
    } catch (err) {
        setError(err.message || "Failed to delete appointment.");
        setIsLoading(false);
    }
  };


  if (isLoading) {
    return <LoadingSpinner message="Loading appointment details..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }

  if (!appointment) {
    return <div className="alert alert-warning mt-3">Appointment not found.</div>;
  }

  const { patient_details, doctor_details, appointment_type_display, appointment_date_time, status, status_display, reason, notes, estimated_duration_minutes } = appointment;

  const canPatientCancel = currentUser?.role === 'PATIENT' && 
                         patient_details?.user?.id === currentUser.id &&
                         !['COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_STAFF', 'NO_SHOW', 'RESCHEDULED'].includes(status);

  const canStaffManage = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'ADMIN' || currentUser.role === 'NURSE');
  const canStaffCancel = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'ADMIN') &&
                       !['COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_STAFF', 'NO_SHOW', 'RESCHEDULED'].includes(status);
  const canStaffEditDetails = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'ADMIN');


  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">Appointment Details (ID: {appointment.id})</h3>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <p><strong>Patient:</strong> {patient_details?.user?.first_name} {patient_details?.user?.last_name} (ID: {patient_details?.user?.id})</p>
              <p><strong>Doctor:</strong> Dr. {doctor_details?.first_name} {doctor_details?.last_name} (ID: {doctor_details?.id})</p>
              <p><strong>Type:</strong> {appointment_type_display || appointment.appointment_type}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Date & Time:</strong> {new Date(appointment_date_time).toLocaleString()}</p>
              <p><strong>Status:</strong> <span className={`badge bg-${status === 'COMPLETED' ? 'success' : status?.includes('CANCELLED') ? 'danger' : 'secondary'}`}>{status_display || APPOINTMENT_STATUSES[status] || status}</span></p>
              <p><strong>Estimated Duration:</strong> {estimated_duration_minutes} minutes</p>
            </div>
          </div>
          <div className="mb-3">
            <p><strong>Reason:</strong> {reason || 'N/A'}</p>
          </div>
          {notes && (
            <div className="mb-3">
              <p><strong>Internal Notes:</strong> {notes}</p>
            </div>
          )}

          <div className="mt-4 pt-3 border-top">
            <h5>Actions:</h5>
            {canPatientCancel && (
              <button className="btn btn-warning me-2 mb-2" onClick={() => handleCancelAppointment(false)} disabled={isLoading}>Cancel My Appointment</button>
            )}
            {canStaffCancel && (
              <button className="btn btn-warning me-2 mb-2" onClick={() => handleCancelAppointment(true)} disabled={isLoading}>Cancel (Staff)</button>
            )}
            {canStaffEditDetails && (
              <Link to={`/appointments/${appointmentId}/edit`} className="btn btn-secondary me-2 mb-2">Edit Appointment</Link>
            )}
            {currentUser?.role === 'ADMIN' && (
              <button className="btn btn-danger me-2 mb-2" onClick={handleDeleteAppointmentAdmin} disabled={isLoading}>Delete (Admin)</button>
            )}
            {canStaffManage && status !== 'COMPLETED' && status !== 'CANCELLED_BY_STAFF' && status !== 'CANCELLED_BY_PATIENT' && (
                <>
                 {status !== 'CONFIRMED' && <button className="btn btn-info me-2 mb-2" onClick={() => handleStatusUpdate('CONFIRMED')} disabled={isLoading}>Confirm Appointment</button>}
                 {status !== 'NO_SHOW' && <button className="btn btn-outline-dark me-2 mb-2" onClick={() => handleStatusUpdate('NO_SHOW')} disabled={isLoading}>Mark as No Show</button>}
                 <button className="btn btn-success me-2 mb-2" onClick={() => handleStatusUpdate('COMPLETED')} disabled={isLoading}>Mark as Completed</button>
                </>
            )}
          </div>
        </div>
      </div>
      {/* TODO: Add sections for related prescriptions, treatments, or link to create them if applicable */}
    </div>
  );
};

export default AppointmentDetails;
