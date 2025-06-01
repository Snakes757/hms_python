// src/components/telemedicine/TelemedicineList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { listTelemedicineSessions, deleteTelemedicineSession, updateTelemedicineSession } from '../../api/telemedicine';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';

const SESSION_STATUS_CLASSES = {
  SCHEDULED: 'info',
  AWAITING_HOST: 'warning',
  AWAITING_GUEST: 'warning',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  FAILED: 'dark',
};

const TelemedicineList = ({ forPatientId, forDoctorId }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const fetchSessions = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError('');
    try {
      let params = {};
      if (forPatientId) {
        params.patient__user__id = forPatientId;
      } else if (forDoctorId) {
        params.doctor__id = forDoctorId;
      } else {
        if (currentUser.role === 'PATIENT') {
          params.patient__user__id = currentUser.id;
        } else if (currentUser.role === 'DOCTOR') {
          params.doctor__id = currentUser.id;
        }
        // Admin, Receptionist, Nurse see a broader list (backend filters)
      }
      const data = await listTelemedicineSessions(params);
      setSessions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch telemedicine sessions.');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentUser, forPatientId, forDoctorId]);

  const handleCancelSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to cancel this telemedicine session?')) {
      setIsLoading(true);
      try {
        // Backend's DELETE for Doctor/Receptionist marks as CANCELLED
        await deleteTelemedicineSession(sessionId); 
        fetchSessions(); // Refresh list
      } catch (err) {
        setError(err.message || 'Failed to cancel session.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleDeleteSessionAdmin = async (sessionId) => {
    if (window.confirm('ADMIN ACTION: Are you sure you want to permanently delete this session?')) {
        setIsLoading(true);
        try {
            await deleteTelemedicineSession(sessionId); // Admin hard delete
            fetchSessions();
        } catch (err) {
            setError(err.message || 'Failed to delete session.');
        } finally {
            setIsLoading(false);
        }
    }
  };


  if (isLoading && sessions.length === 0) {
    return <LoadingSpinner message="Loading telemedicine sessions..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }
  
  if (!currentUser) {
    return <div className="alert alert-warning mt-3">Please log in to view telemedicine sessions.</div>;
  }

  if (sessions.length === 0) {
    return <div className="alert alert-info mt-3">No telemedicine sessions found.</div>;
  }

  const canManageSession = (session) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') return true;
    if (currentUser.role === 'DOCTOR' && session.doctor_details?.id === currentUser.id) return true;
    // Patients generally cannot manage sessions other than providing feedback (handled on details page)
    return false;
  };

  return (
    <div className="mt-0">
      <h4 className="mb-3">Telemedicine Sessions</h4>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-primary">
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Start Time</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.id}</td>
                <td>{session.patient_details?.user?.first_name} {session.patient_details?.user?.last_name}</td>
                <td>Dr. {session.doctor_details?.first_name} {session.doctor_details?.last_name}</td>
                <td>{new Date(session.session_start_time).toLocaleString()}</td>
                <td>
                  <span className={`badge bg-${SESSION_STATUS_CLASSES[session.status] || 'secondary'}`}>
                    {session.status_display || session.status}
                  </span>
                </td>
                <td>{session.reason_for_consultation?.substring(0, 50) || 'N/A'}{session.reason_for_consultation?.length > 50 ? '...' : ''}</td>
                <td>
                  <Link to={`/telemedicine/sessions/${session.id}`} className="btn btn-sm btn-outline-info me-2">
                    View
                  </Link>
                  {canManageSession(session) && session.status !== 'COMPLETED' && session.status !== 'CANCELLED' && session.status !== 'FAILED' && (
                    <button 
                      className="btn btn-sm btn-outline-warning me-2" 
                      onClick={() => handleCancelSession(session.id)}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  )}
                   {currentUser.role === 'ADMIN' && (
                     <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => handleDeleteSessionAdmin(session.id)}
                        disabled={isLoading}
                    >
                        Delete (Admin)
                    </button>
                  )}
                  {/* Link to join session if status allows and URL exists */}
                  {session.session_url && (session.status === 'SCHEDULED' || session.status === 'AWAITING_HOST' || session.status === 'AWAITING_GUEST' || session.status === 'IN_PROGRESS') && (
                    <a href={session.session_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-success">
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
