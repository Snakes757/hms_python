// src/components/telemedicine/TelemedicineSessionDetails.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTelemedicineSessionDetails, updateTelemedicineSession, deleteTelemedicineSession } from '../../api/telemedicine';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const SESSION_STATUS_DISPLAY = {
  SCHEDULED: 'Scheduled',
  AWAITING_HOST: 'Awaiting Host (Doctor)',
  AWAITING_GUEST: 'Awaiting Guest (Patient)',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

const TelemedicineSessionDetails = ({ sessionIdParam }) => {
  const { sessionId: routeSessionId } = useParams();
  const sessionId = sessionIdParam || routeSessionId;

  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [patientFeedback, setPatientFeedback] = useState('');
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);


  const fetchSessionDetails = async () => {
    if (!sessionId) {
      setError("Session ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const data = await getTelemedicineSessionDetails(sessionId);
      setSession(data);
      setPatientFeedback(data.patient_feedback || '');
    } catch (err) {
      setError(err.message || 'Failed to fetch session details.');
      console.error("Error fetching session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);
  
  const handlePatientFeedbackSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await updateTelemedicineSession(sessionId, { patient_feedback: patientFeedback });
        setIsEditingFeedback(false);
        fetchSessionDetails(); // Refresh details
    } catch (err) {
        setError(err.message || "Failed to submit feedback.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (window.confirm('Are you sure you want to cancel this telemedicine session?')) {
      setIsLoading(true);
      try {
        await deleteTelemedicineSession(sessionId); // Backend handles logic for CANCELLED status
        fetchSessionDetails(); 
      } catch (err) {
        setError(err.message || 'Failed to cancel session.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleDeleteSessionAdmin = async () => {
    if (window.confirm('ADMIN ACTION: Are you sure you want to permanently delete this session?')) {
        setIsLoading(true);
        try {
            await deleteTelemedicineSession(sessionId); // Admin hard delete
            navigate('/telemedicine/sessions', { replace: true, state: { message: 'Session deleted successfully.' } });
        } catch (err) {
            setError(err.message || 'Failed to delete session.');
            setIsLoading(false);
        }
    }
  };


  if (isLoading && !session) {
    return <LoadingSpinner message="Loading session details..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }

  if (!session) {
    return <div className="alert alert-warning mt-3">Session not found.</div>;
  }

  const { patient_details, doctor_details, appointment_details, session_start_time, session_end_time, status, reason_for_consultation, doctor_notes, recording_url, session_url, estimated_duration_minutes } = session;

  const canManage = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST' || (currentUser.role === 'DOCTOR' && doctor_details?.id === currentUser.id));
  const isParticipant = currentUser && ( (patient_details?.user?.id === currentUser.id) || (doctor_details?.id === currentUser.id) );


  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Telemedicine Session (ID: {session.id})</h3>
           {canManage && (
            <Link to={`/telemedicine/sessions/${sessionId}/edit`} className="btn btn-light btn-sm">
              Edit Session
            </Link>
          )}
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <p><strong>Patient:</strong> {patient_details?.user?.first_name} {patient_details?.user?.last_name}</p>
              <p><strong>Doctor:</strong> Dr. {doctor_details?.first_name} {doctor_details?.last_name}</p>
              {appointment_details && <p><strong>Linked Appointment ID:</strong> <Link to={`/appointments/${appointment_details.id}`}>{appointment_details.id}</Link></p>}
            </div>
            <div className="col-md-6">
              <p><strong>Start Time:</strong> {new Date(session_start_time).toLocaleString()}</p>
              {session_end_time && <p><strong>End Time:</strong> {new Date(session_end_time).toLocaleString()}</p>}
              <p><strong>Status:</strong> <span className={`badge bg-${SESSION_STATUS_CLASSES[status] || 'secondary'}`}>{SESSION_STATUS_DISPLAY[status] || status}</span></p>
              <p><strong>Duration:</strong> {session.duration_minutes || estimated_duration_minutes || 'N/A'} minutes</p>
            </div>
          </div>
          <p><strong>Reason for Consultation:</strong> {reason_for_consultation || 'N/A'}</p>
          {session_url && <p><strong>Session URL:</strong> <a href={session_url} target="_blank" rel="noopener noreferrer">{session_url}</a></p>}
          {recording_url && <p><strong>Recording URL:</strong> <a href={recording_url} target="_blank" rel="noopener noreferrer">{recording_url}</a></p>}
          
          {doctor_notes && (currentUser.role === 'DOCTOR' || currentUser.role === 'ADMIN' || currentUser.role === 'NURSE') && (
            <div className="mt-3 p-3 bg-light rounded">
                <h5>Doctor's Notes:</h5>
                <p style={{whiteSpace: "pre-wrap"}}>{doctor_notes}</p>
            </div>
          )}

          <div className="mt-3 p-3 bg-light rounded">
            <h5>Patient Feedback:</h5>
            {isEditingFeedback ? (
                <form onSubmit={handlePatientFeedbackSubmit}>
                    <textarea 
                        className="form-control mb-2" 
                        value={patientFeedback} 
                        onChange={(e) => setPatientFeedback(e.target.value)}
                        rows="3"
                    />
                    <button type="submit" className="btn btn-primary btn-sm me-2" disabled={isLoading}>Save Feedback</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {setIsEditingFeedback(false); setPatientFeedback(session.patient_feedback || '');}}>Cancel</button>
                </form>
            ) : (
                <>
                    <p style={{whiteSpace: "pre-wrap"}}>{session.patient_feedback || 'No feedback provided yet.'}</p>
                    {currentUser?.id === patient_details?.user?.id && status === 'COMPLETED' && (
                        <button className="btn btn-outline-primary btn-sm mt-2" onClick={() => setIsEditingFeedback(true)}>
                            {session.patient_feedback ? 'Edit Feedback' : 'Add Feedback'}
                        </button>
                    )}
                </>
            )}
          </div>


          <div className="mt-4 pt-3 border-top">
            <h5>Actions:</h5>
            {isParticipant && session_url && (status === 'SCHEDULED' || status === 'AWAITING_HOST' || status === 'AWAITING_GUEST' || status === 'IN_PROGRESS') && (
                <a href={session_url} target="_blank" rel="noopener noreferrer" className="btn btn-success me-2 mb-2">Join Session</a>
            )}
            {canManage && status !== 'COMPLETED' && status !== 'CANCELLED' && status !== 'FAILED' && (
              <button className="btn btn-warning me-2 mb-2" onClick={handleCancelSession} disabled={isLoading}>Cancel Session</button>
            )}
            {currentUser?.role === 'ADMIN' && (
              <button className="btn btn-danger me-2 mb-2" onClick={handleDeleteSessionAdmin} disabled={isLoading}>Delete (Admin)</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TelemedicineSessionDetails;
