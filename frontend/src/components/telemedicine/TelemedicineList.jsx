import React, { useState, useEffect, useContext } from 'react';
import { listTelemedicineSessions, deleteTelemedicineSession } from '../../api/telemedicine'; // Removed unused updateTelemedicineSession
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { USER_ROLES } from '../../utils/constants'; // Import USER_ROLES

// Define display text and Tailwind classes for different statuses
const SESSION_STATUS_DISPLAY = {
  SCHEDULED: 'Scheduled',
  AWAITING_HOST: 'Awaiting Doctor',
  AWAITING_GUEST: 'Awaiting Patient',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

const SESSION_STATUS_CLASSES = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  AWAITING_HOST: 'bg-yellow-100 text-yellow-800',
  AWAITING_GUEST: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FAILED: 'bg-gray-100 text-gray-800',
};

const TelemedicineList = ({ forPatientId, forDoctorId }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const fetchSessions = async () => {
    if (!currentUser) {
        // setError("Please log in to view telemedicine sessions."); // Set error if not logged in
        setSessions([]); // Clear sessions
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      let params = {};
      if (forPatientId) {
        params.patient__user__id = forPatientId;
      } else if (forDoctorId) {
        params.doctor__id = forDoctorId;
      } else {
        if (currentUser.role === USER_ROLES.PATIENT) {
          params.patient__user__id = currentUser.id;
        } else if (currentUser.role === USER_ROLES.DOCTOR) {
          params.doctor__id = currentUser.id;
        }
        // For ADMIN/RECEPTIONIST, no specific user ID filter is applied by default, listing all.
      }
      const data = await listTelemedicineSessions(params);
      setSessions(Array.isArray(data) ? data : []); // Ensure data is an array
    } catch (err) {
      setError(err.message || 'Failed to fetch telemedicine sessions.');
      setSessions([]); // Clear sessions on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentUser, forPatientId, forDoctorId]);

  const handleCancelSession = async (sessionId) => {
    // For staff/admin, directly use deleteTelemedicineSession which might set status to CANCELLED or delete
    // For patients, they should ideally have a different endpoint or logic if they can only "request cancellation"
    if (window.confirm('Are you sure you want to cancel this telemedicine session?')) {
      setIsLoading(true); // Consider a more granular loading state for the specific row
      try {
        await deleteTelemedicineSession(sessionId); // This implies a hard delete or a backend logic for cancellation
        fetchSessions(); // Refresh the list
      } catch (err) {
        setError(err.message || 'Failed to cancel session.');
      } finally {
        setIsLoading(false); // Reset granular loading state
      }
    }
  };

  const handleDeleteSessionAdmin = async (sessionId) => {
    if (window.confirm('ADMIN ACTION: Are you sure you want to permanently delete this session?')) {
        setIsLoading(true);
        try {
            await deleteTelemedicineSession(sessionId);
            fetchSessions(); // Refresh list
        } catch (err) {
            setError(err.message || 'Failed to delete session.');
        } finally {
            setIsLoading(false);
        }
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex justify-center items-center p-10">
        <LoadingSpinner message="Loading telemedicine sessions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
        <p>Please log in to view telemedicine sessions.</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
        <p>No telemedicine sessions found matching your criteria.</p>
      </div>
    );
  }

  const canManageSession = (session) => {
    if (!currentUser) return false;
    if (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST) return true;
    if (currentUser.role === USER_ROLES.DOCTOR && session.doctor_details?.id === currentUser.id) return true;
    // Patients might be able to cancel their own upcoming sessions
    if (currentUser.role === USER_ROLES.PATIENT && session.patient_details?.user?.id === currentUser.id) return true;
    return false;
  };


  return (
    <div className="mt-0">
      {/* The h4 was in TelemedicineListPage, so removed from here if it's a sub-component */}
      {/* <h4 className="mb-3 text-xl font-semibold text-gray-700">Telemedicine Sessions</h4> */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {session.patient_details?.user?.first_name} {session.patient_details?.user?.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Dr. {session.doctor_details?.first_name} {session.doctor_details?.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(session.session_start_time).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${SESSION_STATUS_CLASSES[session.status] || 'bg-gray-100 text-gray-800'}`}>
                    {SESSION_STATUS_DISPLAY[session.status] || session.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title={session.reason_for_consultation}>
                    {session.reason_for_consultation?.substring(0, 50) || 'N/A'}{session.reason_for_consultation?.length > 50 ? '...' : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link to={`/telemedicine/sessions/${session.id}`} className="text-indigo-600 hover:text-indigo-900">
                    View
                  </Link>
                  {canManageSession(session) && session.status !== 'COMPLETED' && session.status !== 'CANCELLED' && session.status !== 'FAILED' && (
                    <button
                      className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                      onClick={() => handleCancelSession(session.id)} // Patient/Doctor/Receptionist cancel (might be soft delete or status update)
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  )}
                   {currentUser.role === USER_ROLES.ADMIN && ( // Admin hard delete
                     <button
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        onClick={() => handleDeleteSessionAdmin(session.id)}
                        disabled={isLoading}
                    >
                        Delete
                    </button>
                  )}
                  {session.session_url && (session.status === 'SCHEDULED' || session.status === 'AWAITING_HOST' || session.status === 'AWAITING_GUEST' || session.status === 'IN_PROGRESS') && (
                    <a href={session.session_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-900">
                        Join Session
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TelemedicineList;
