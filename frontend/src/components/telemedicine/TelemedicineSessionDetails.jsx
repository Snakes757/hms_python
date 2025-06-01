// src/components/telemedicine/TelemedicineSessionDetails.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getTelemedicineSessionDetails,
  updateTelemedicineSession,
  deleteTelemedicineSession,
} from "../../api/telemedicine";
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import { USER_ROLES, TELEMEDICINE_SESSION_STATUS } from "../../utils/constants"; // Import TELEMEDICINE_SESSION_STATUS

// Define status display mapping
const SESSION_STATUS_DISPLAY = {
  [TELEMEDICINE_SESSION_STATUS.SCHEDULED]: "Scheduled",
  [TELEMEDICINE_SESSION_STATUS.AWAITING_HOST]: "Awaiting Host (Doctor)",
  [TELEMEDICINE_SESSION_STATUS.AWAITING_GUEST]: "Awaiting Guest (Patient)",
  [TELEMEDICINE_SESSION_STATUS.IN_PROGRESS]: "In Progress",
  [TELEMEDICINE_SESSION_STATUS.COMPLETED]: "Completed",
  [TELEMEDICINE_SESSION_STATUS.CANCELLED]: "Cancelled",
  [TELEMEDICINE_SESSION_STATUS.FAILED]: "Failed",
};

// Define CSS classes for statuses (as used in the original code)
const SESSION_STATUS_CLASSES = {
  [TELEMEDICINE_SESSION_STATUS.SCHEDULED]: "info",
  [TELEMEDICINE_SESSION_STATUS.AWAITING_HOST]: "warning",
  [TELEMEDICINE_SESSION_STATUS.AWAITING_GUEST]: "warning",
  [TELEMEDICINE_SESSION_STATUS.IN_PROGRESS]: "primary",
  [TELEMEDICINE_SESSION_STATUS.COMPLETED]: "success",
  [TELEMEDICINE_SESSION_STATUS.CANCELLED]: "danger",
  [TELEMEDICINE_SESSION_STATUS.FAILED]: "dark",
};

const TelemedicineSessionDetails = ({ sessionIdParam }) => {
  const { sessionId: routeSessionId } = useParams();
  const sessionId = sessionIdParam || routeSessionId;

  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [patientFeedback, setPatientFeedback] = useState("");
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  const fetchSessionDetails = async () => {
    if (!sessionId) {
      setError("Session ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const data = await getTelemedicineSessionDetails(sessionId);
      setSession(data);
      setPatientFeedback(data.patient_feedback || "");
    } catch (err) {
      setError(err.message || "Failed to fetch session details.");
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
    if (!session || currentUser?.id !== session.patient_details?.user?.id) {
      setError("You can only submit feedback for your own sessions.");
      return;
    }
    if (session.status !== TELEMEDICINE_SESSION_STATUS.COMPLETED) {
      // Use constant
      setError("Feedback can only be submitted for completed sessions.");
      return;
    }
    setIsLoading(true);
    try {
      await updateTelemedicineSession(sessionId, {
        patient_feedback: patientFeedback,
      });
      setIsEditingFeedback(false);
      fetchSessionDetails(); // Refresh data
    } catch (err) {
      setError(err.message || "Failed to submit feedback.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (
      window.confirm(
        "Are you sure you want to cancel this telemedicine session?"
      )
    ) {
      setIsLoading(true);
      try {
        await updateTelemedicineSession(sessionId, {
          status: TELEMEDICINE_SESSION_STATUS.CANCELLED,
        }); // Use constant
        fetchSessionDetails(); // Refresh data
      } catch (err) {
        setError(err.message || "Failed to cancel session.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteSessionAdmin = async () => {
    if (
      window.confirm(
        "ADMIN ACTION: Are you sure you want to permanently delete this session?"
      )
    ) {
      setIsLoading(true);
      try {
        await deleteTelemedicineSession(sessionId);
        navigate("/telemedicine/sessions", {
          replace: true,
          state: { message: "Session deleted successfully." },
        });
      } catch (err) {
        setError(err.message || "Failed to delete session.");
        setIsLoading(false);
      }
    }
  };

  if (isLoading && !session) {
    return <LoadingSpinner message="Loading session details..." />;
  }

  if (error && !session) {
    return (
      <div className="alert alert-danger mt-3" role="alert">
        {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="alert alert-warning mt-3">
        Session not found or you do not have permission to view it.
      </div>
    );
  }

  const {
    patient_details,
    doctor_details,
    appointment_details,
    session_start_time,
    session_end_time,
    status,
    reason_for_consultation,
    doctor_notes,
    recording_url,
    session_url,
    estimated_duration_minutes,
  } = session;

  const canManage =
    currentUser &&
    (currentUser.role === USER_ROLES.ADMIN ||
      currentUser.role === USER_ROLES.RECEPTIONIST ||
      (currentUser.role === USER_ROLES.DOCTOR &&
        doctor_details?.id === currentUser.id));
  const isParticipant =
    currentUser &&
    (patient_details?.user?.id === currentUser.id ||
      doctor_details?.id === currentUser.id);
  const canPatientSubmitFeedback =
    currentUser?.id === patient_details?.user?.id &&
    status === TELEMEDICINE_SESSION_STATUS.COMPLETED; // Use constant

  return (
    <div className="container mt-0">
      <div className="card shadow-sm">
        <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0 h5">Telemedicine Session (ID: {session.id})</h3>
          {canManage && (
            <Link
              to={`/telemedicine/sessions/${sessionId}/edit`}
              className="btn btn-light btn-sm"
            >
              Edit Session
            </Link>
          )}
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <div className="row mb-3">
            <div className="col-md-6">
              <p>
                <strong>Patient:</strong> {patient_details?.user?.first_name}{" "}
                {patient_details?.user?.last_name}
              </p>
              <p>
                <strong>Doctor:</strong> Dr. {doctor_details?.first_name}{" "}
                {doctor_details?.last_name}
              </p>
              {appointment_details && (
                <p>
                  <strong>Linked Appointment ID:</strong>{" "}
                  <Link to={`/appointments/${appointment_details.id}`}>
                    {appointment_details.id}
                  </Link>
                </p>
              )}
            </div>
            <div className="col-md-6">
              <p>
                <strong>Start Time:</strong>{" "}
                {new Date(session_start_time).toLocaleString()}
              </p>
              {session_end_time && (
                <p>
                  <strong>End Time:</strong>{" "}
                  {new Date(session_end_time).toLocaleString()}
                </p>
              )}
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`badge bg-${
                    SESSION_STATUS_CLASSES[status] || "secondary"
                  }`}
                >
                  {SESSION_STATUS_DISPLAY[status] || status}
                </span>
              </p>
              <p>
                <strong>Duration:</strong>{" "}
                {session.duration_minutes ||
                  estimated_duration_minutes ||
                  "N/A"}{" "}
                minutes
              </p>
            </div>
          </div>
          <p>
            <strong>Reason for Consultation:</strong>{" "}
            {reason_for_consultation || "N/A"}
          </p>
          {session_url && (
            <p>
              <strong>Session URL:</strong>{" "}
              <a href={session_url} target="_blank" rel="noopener noreferrer">
                {session_url}
              </a>
            </p>
          )}
          {recording_url && (
            <p>
              <strong>Recording URL:</strong>{" "}
              <a href={recording_url} target="_blank" rel="noopener noreferrer">
                {recording_url}
              </a>
            </p>
          )}

          {doctor_notes &&
            (currentUser.role === USER_ROLES.DOCTOR ||
              currentUser.role === USER_ROLES.ADMIN ||
              currentUser.role === USER_ROLES.NURSE) && (
              <div className="mt-3 p-3 bg-light rounded border">
                <h5 className="h6">Doctor's Notes:</h5>
                <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                  {doctor_notes}
                </p>
              </div>
            )}

          <div className="mt-3 p-3 bg-light rounded border">
            <h5 className="h6">Patient Feedback:</h5>
            {isEditingFeedback && canPatientSubmitFeedback ? (
              <form onSubmit={handlePatientFeedbackSubmit}>
                <textarea
                  className="form-control mb-2"
                  value={patientFeedback}
                  onChange={(e) => setPatientFeedback(e.target.value)}
                  rows="3"
                  placeholder="Share your experience..."
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm me-2"
                  disabled={isLoading}
                >
                  Save Feedback
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setIsEditingFeedback(false);
                    setPatientFeedback(session.patient_feedback || "");
                  }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                  {session.patient_feedback || "No feedback provided yet."}
                </p>
                {canPatientSubmitFeedback && !isEditingFeedback && (
                  <button
                    className="btn btn-outline-primary btn-sm mt-2"
                    onClick={() => setIsEditingFeedback(true)}
                  >
                    {session.patient_feedback
                      ? "Edit Feedback"
                      : "Add Feedback"}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-top">
            <h5 className="h6">Actions:</h5>
            {isParticipant &&
              session_url &&
              (status === TELEMEDICINE_SESSION_STATUS.SCHEDULED ||
                status === TELEMEDICINE_SESSION_STATUS.AWAITING_HOST ||
                status === TELEMEDICINE_SESSION_STATUS.AWAITING_GUEST ||
                status === TELEMEDICINE_SESSION_STATUS.IN_PROGRESS) && ( // Use constants
                <a
                  href={session_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success me-2 mb-2"
                >
                  Join Session
                </a>
              )}
            {canManage &&
              status !== TELEMEDICINE_SESSION_STATUS.COMPLETED &&
              status !== TELEMEDICINE_SESSION_STATUS.CANCELLED &&
              status !== TELEMEDICINE_SESSION_STATUS.FAILED && ( // Use constants
                <button
                  className="btn btn-warning me-2 mb-2 btn-sm"
                  onClick={handleCancelSession}
                  disabled={isLoading}
                >
                  Cancel Session
                </button>
              )}
            {currentUser?.role === USER_ROLES.ADMIN && (
              <button
                className="btn btn-danger me-2 mb-2 btn-sm"
                onClick={handleDeleteSessionAdmin}
                disabled={isLoading}
              >
                Delete (Admin)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemedicineSessionDetails;
