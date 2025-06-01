// src/components/appointments/AppointmentList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { listAppointments, deleteAppointment, updateAppointment } from '../../api/appointments';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';

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

const AppointmentList = ({ forPatientId, forDoctorId }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const fetchAppointments = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError('');
    try {
      let params = {};
      if (forPatientId) { // If component is used in a patient's specific view
        params.patient__user__id = forPatientId;
      } else if (forDoctorId) { // If component is used in a doctor's specific view
         params.doctor__id = forDoctorId;
      } else { // General list, backend filters by role
        if (currentUser.role === 'PATIENT') {
          params.patient__user__id = currentUser.id;
        } else if (currentUser.role === 'DOCTOR') {
          params.doctor__id = currentUser.id;
        }
        // Admins, Receptionists, Nurses see a broader list (backend handles filtering)
      }
      const data = await listAppointments(params);
      setAppointments(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch appointments.');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentUser, forPatientId, forDoctorId]);

  const handleCancelAppointment = async (appointmentId, byStaff = false) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel this appointment?`);
    if (!confirmCancel) return;

    setIsLoading(true);
    try {
      if (byStaff) {
        await updateAppointment(appointmentId, { status: 'CANCELLED_BY_STAFF' });
      } else { // Patient cancelling
        await updateAppointment(appointmentId, { status: 'CANCELLED_BY_PATIENT' });
      }
      fetchAppointments(); // Refresh list
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAppointmentAdmin = async (appointmentId) => {
    const confirmDelete = window.confirm("ADMIN ACTION: Are you sure you want to permanently delete this appointment? This cannot be undone.");
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
        await deleteAppointment(appointmentId); // Backend handles hard delete for admin
        fetchAppointments(); // Refresh list
    } catch (err) {
        setError(err.message || "Failed to delete appointment.");
    } finally {
        setIsLoading(false);
    }
  };


  if (isLoading && appointments.length === 0) {
    return <LoadingSpinner message="Loading appointments..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }

  if (!currentUser) {
    return <div className="alert alert-warning mt-3">Please log in to view appointments.</div>;
  }
  
  if (appointments.length === 0) {
    return <div className="alert alert-info mt-3">No appointments found.</div>;
  }

  const canPatientCancel = (appt) => {
    return currentUser.role === 'PATIENT' && 
           appt.patient_details?.user?.id === currentUser.id &&
           !['COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_STAFF', 'NO_SHOW', 'RESCHEDULED'].includes(appt.status);
  };

  const canStaffManage = (appt) => { // Doctor, Receptionist, Admin
    return currentUser.role === 'DOCTOR' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'ADMIN' || currentUser.role === 'NURSE';
  };
   const canStaffCancel = (appt) => {
    return (currentUser.role === 'DOCTOR' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'ADMIN') &&
           !['COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_STAFF', 'NO_SHOW', 'RESCHEDULED'].includes(appt.status);
  };


  return (
    <div className="mt-0"> {/* Adjusted margin for embedding */}
      <h4 className="mb-3">Appointments</h4>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-primary">
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Type</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id}>
                <td>{appt.id}</td>
                <td>{appt.patient_details?.user?.first_name || 'N/A'} {appt.patient_details?.user?.last_name || ''}</td>
                <td>Dr. {appt.doctor_details?.first_name || 'N/A'} {appt.doctor_details?.last_name || ''}</td>
                <td>{appt.appointment_type_display || appt.appointment_type}</td>
                <td>{new Date(appt.appointment_date_time).toLocaleString()}</td>
                <td>
                  <span className={`badge bg-${appt.status === 'COMPLETED' ? 'success' : appt.status?.includes('CANCELLED') ? 'danger' : 'secondary'}`}>
                    {appt.status_display || APPOINTMENT_STATUSES[appt.status] || appt.status}
                  </span>
                </td>
                <td>{appt.reason || 'N/A'}</td>
                <td>
                  <Link to={`/appointments/${appt.id}`} className="btn btn-sm btn-outline-info me-2">View</Link>
                  {canPatientCancel(appt) && (
                    <button 
                      className="btn btn-sm btn-outline-warning me-2" 
                      onClick={() => handleCancelAppointment(appt.id, false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  )}
                  {canStaffCancel(appt) && (
                    <button 
                      className="btn btn-sm btn-outline-warning me-2" 
                      onClick={() => handleCancelAppointment(appt.id, true)}
                      disabled={isLoading}
                    >
                      Cancel (Staff)
                    </button>
                  )}
                  {currentUser.role === 'ADMIN' && (
                     <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => handleDeleteAppointmentAdmin(appt.id)}
                        disabled={isLoading}
                    >
                        Delete (Admin)
                    </button>
                  )}
                  {/* More actions like 'Edit' for staff can be added here */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentList;
