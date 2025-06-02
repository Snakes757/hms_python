import React, { useState, useEffect, useContext } from 'react';
import { listAppointments, deleteAppointment, updateAppointment } from '../../api/appointments'; // Path is correct from src/pages/appointments/
import { AuthContext } from '../../context/AuthContext'; // Path is correct from src/pages/appointments/
import LoadingSpinner from '../../components/common/LoadingSpinner'; // CORRECTED PATH
import { Link } from 'react-router-dom';
import { formatDate, formatDateTime, capitalizeWords } from '../../utils/formatters'; // Assuming formatDateTime is needed too
import { USER_ROLES } from '../../utils/constants';

const APPOINTMENT_STATUSES = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  CANCELLED_BY_PATIENT: 'Cancelled by Patient',
  CANCELLED_BY_STAFF: 'Cancelled by Staff',
  COMPLETED: 'Completed',
  NO_SHOW: 'No Show',
  RESCHEDULED: 'Rescheduled',
};

// Helper to determine badge color based on status
const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'COMPLETED': return 'bg-green-100 text-green-800';
        case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
        case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800';
        case 'CANCELLED_BY_PATIENT':
        case 'CANCELLED_BY_STAFF':
            return 'bg-red-100 text-red-800';
        case 'NO_SHOW': return 'bg-gray-100 text-gray-800';
        case 'RESCHEDULED': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

// This component now acts as the page content for listing appointments.
// It includes logic similar to what was in the AppointmentList.jsx component.
const AppointmentListPage = ({ forPatientId, forDoctorId }) => {
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
      if (forPatientId) { // If this page is used in a context to show appointments for a specific patient
        params.patient__user__id = forPatientId;
      } else if (forDoctorId) { // Or for a specific doctor
         params.doctor__id = forDoctorId;
      } else {
        // General list, apply role-based filtering if necessary based on the logged-in user
        if (currentUser.role === USER_ROLES.PATIENT) {
          params.patient__user__id = currentUser.id;
        } else if (currentUser.role === USER_ROLES.DOCTOR) {
          params.doctor__id = currentUser.id; // Doctors see their own appointments
        }
        // For ADMIN, RECEPTIONIST, NURSE - no specific user ID filter by default, shows all or as per backend logic
      }
      const data = await listAppointments(params);
      setAppointments(data || []); // Assuming API returns array directly or { results: [] }
    } catch (err) {
      setError(err.message || 'Failed to fetch appointments.');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentUser, forPatientId, forDoctorId]); // Re-fetch if these props change

  const handleCancelAppointment = async (appointmentId, byStaff = false) => {
    // Confirmation dialog - using window.confirm as a placeholder
    if (!window.confirm(`Are you sure you want to cancel this appointment?`)) return;

    setIsLoading(true);
    try {
      const statusToSet = byStaff ? 'CANCELLED_BY_STAFF' : 'CANCELLED_BY_PATIENT';
      await updateAppointment(appointmentId, { status: statusToSet });
      fetchAppointments(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAppointmentAdmin = async (appointmentId) => {
    if (!window.confirm("ADMIN ACTION: Are you sure you want to permanently delete this appointment? This cannot be undone.")) return;

    setIsLoading(true);
    try {
        await deleteAppointment(appointmentId);
        fetchAppointments(); // Refresh the list
    } catch (err) {
        setError(err.message || "Failed to delete appointment.");
    } finally {
        setIsLoading(false);
    }
  };

  const canScheduleAppointment = currentUser && (
    currentUser.role === USER_ROLES.ADMIN ||
    currentUser.role === USER_ROLES.RECEPTIONIST ||
    currentUser.role === USER_ROLES.DOCTOR ||
    currentUser.role === USER_ROLES.PATIENT
  );

  // Determine if the current user can cancel a specific appointment
  const canPatientCancel = (appt) => {
    return currentUser.role === USER_ROLES.PATIENT &&
           appt.patient_details?.user?.id === currentUser.id &&
           !['COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_STAFF', 'NO_SHOW', 'RESCHEDULED'].includes(appt.status);
  };

   const canStaffCancel = (appt) => {
    return (currentUser.role === USER_ROLES.DOCTOR || currentUser.role === USER_ROLES.RECEPTIONIST || currentUser.role === USER_ROLES.ADMIN) &&
           !['COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_STAFF', 'NO_SHOW', 'RESCHEDULED'].includes(appt.status);
  };

  return (
    <>
      {canScheduleAppointment && (
        <div className="mb-6 flex justify-end">
          <Link
            to="/appointments/new" // Ensure this route is correctly defined in AppRoutes.jsx
            className="px-6 py-2.5 bg-green-600 text-white font-medium text-sm leading-tight uppercase rounded-md shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg transition duration-150 ease-in-out"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2 -mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Schedule New Appointment
          </Link>
        </div>
      )}

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl">
        {/* The "Appointments" title that was in AppointmentList.jsx is removed from here,
            as PageWithSidebar in AppRoutes.jsx should provide the main page title. */}

        {isLoading && appointments.length === 0 && (
          <div className="flex justify-center items-center p-10"><LoadingSpinner message="Loading appointments..." /></div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{error}</div>
        )}

        {!currentUser && !isLoading && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">Please log in to view appointments.</div>
        )}

        {currentUser && appointments.length === 0 && !isLoading && !error && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">No appointments found.</div>
        )}

        {appointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{appt.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{appt.patient_details?.user?.first_name || 'N/A'} {appt.patient_details?.user?.last_name || ''}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">Dr. {appt.doctor_details?.first_name || 'N/A'} {appt.doctor_details?.last_name || ''}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{appt.appointment_type_display || capitalizeWords(appt.appointment_type?.replace(/_/g, ' ')) || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDateTime(appt.appointment_date_time)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(appt.status)}`}>
                        {APPOINTMENT_STATUSES[appt.status] || capitalizeWords(appt.status?.replace(/_/g, ' ')) || appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs" title={appt.reason}>{appt.reason || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link to={`/appointments/${appt.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                      {canPatientCancel(appt) && (
                        <button
                          onClick={() => handleCancelAppointment(appt.id, false)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      {canStaffCancel(appt) && (
                        <button
                          onClick={() => handleCancelAppointment(appt.id, true)}
                          disabled={isLoading}
                          className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                        >
                          Cancel (Staff)
                        </button>
                      )}
                      {currentUser.role === USER_ROLES.ADMIN && (
                         <button
                            onClick={() => handleDeleteAppointmentAdmin(appt.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                            Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AppointmentListPage;
