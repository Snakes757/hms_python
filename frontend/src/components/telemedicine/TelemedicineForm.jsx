// src/components/telemedicine/TelemedicineForm.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  createTelemedicineSession,
  updateTelemedicineSession,
  getTelemedicineSessionDetails,
} from "../../api/telemedicine";
import { getActiveDoctors } from "../../api/appointments";
import { listAllPatients } from "../../api/patients";
import { listAppointments } from "../../api/appointments";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom"; // Ensure react-router-dom is installed
import LoadingSpinner from "../common/LoadingSpinner";
import { USER_ROLES } from "../../utils/constants";

const SESSION_STATUS_CHOICES_STAFF = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "AWAITING_HOST", label: "Awaiting Host (Doctor)" },
  { value: "AWAITING_GUEST", label: "Awaiting Guest (Patient)" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "FAILED", label: "Failed" },
];

const TelemedicineForm = ({ sessionId, onFormSubmitSuccess }) => {
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    appointment: "",
    session_start_time: new Date(new Date().setMinutes(0))
      .toISOString()
      .slice(0, 16),
    estimated_duration_minutes: 30,
    session_url: "",
    status: "SCHEDULED",
    reason_for_consultation: "",
    doctor_notes: "",
    patient_feedback: "",
  });

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [telemedicineAppointments, setTelemedicineAppointments] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = Boolean(sessionId);

  useEffect(() => {
    const loadSupportData = async () => {
      setIsLoading(true);
      try {
        const doctorsData = await getActiveDoctors();
        setDoctors(doctorsData || []);

        if (
          currentUser &&
          (currentUser.role === USER_ROLES.ADMIN ||
            currentUser.role === USER_ROLES.RECEPTIONIST ||
            currentUser.role === USER_ROLES.DOCTOR)
        ) {
          const patientsData = await listAllPatients();
          setPatients(patientsData?.results || patientsData || []); // Access .results if paginated

          const apptParams = {
            appointment_type: "TELEMEDICINE",
            telemedicine_session_details__isnull: true,
          };
          const availableApptsData = await listAppointments(apptParams);
          setTelemedicineAppointments(
            availableApptsData?.results || availableApptsData || []
          ); // Access .results if paginated
        } else if (currentUser && currentUser.role === USER_ROLES.PATIENT) {
          setFormData((prev) => ({ ...prev, patient: currentUser.id }));
        }
      } catch (err) {
        setError("Failed to load support data: " + err.message);
        console.error("Error loading support data for TelemedicineForm:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSupportData();
  }, [currentUser]);

  useEffect(() => {
    if (isEditing && sessionId) {
      setIsLoading(true);
      getTelemedicineSessionDetails(sessionId)
        .then((data) => {
          setFormData({
            patient: data.patient_details.user.id,
            doctor: data.doctor_details.id,
            appointment: data.appointment || "",
            session_start_time: new Date(data.session_start_time)
              .toISOString()
              .slice(0, 16),
            estimated_duration_minutes: data.estimated_duration_minutes || 30,
            session_url: data.session_url || "",
            status: data.status,
            reason_for_consultation: data.reason_for_consultation || "",
            doctor_notes: data.doctor_notes || "",
            patient_feedback: data.patient_feedback || "",
          });
          if (
            data.appointment_details &&
            !telemedicineAppointments.find(
              (a) => a.id === data.appointment_details.id
            )
          ) {
            setTelemedicineAppointments((prev) => [
              data.appointment_details,
              ...prev.filter((a) => a.id !== data.appointment_details.id),
            ]);
          }
        })
        .catch((err) =>
          setError("Failed to load session details: " + err.message)
        )
        .finally(() => setIsLoading(false));
    }
  }, [sessionId, isEditing]); // Removed telemedicineAppointments from deps to avoid loop

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "appointment" && value) {
      const selectedAppt = telemedicineAppointments.find(
        (appt) => appt.id.toString() === value
      );
      if (selectedAppt) {
        setFormData((prev) => ({
          ...prev,
          patient: selectedAppt.patient_details.user.id,
          doctor: selectedAppt.doctor_details.id,
          session_start_time: new Date(selectedAppt.appointment_date_time)
            .toISOString()
            .slice(0, 16),
          reason_for_consultation:
            selectedAppt.reason || prev.reason_for_consultation,
          estimated_duration_minutes:
            selectedAppt.estimated_duration_minutes ||
            prev.estimated_duration_minutes,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    let payload = { ...formData }; // Use let here
    payload.patient = parseInt(payload.patient, 10);
    payload.doctor = parseInt(payload.doctor, 10);
    payload.estimated_duration_minutes = parseInt(
      payload.estimated_duration_minutes,
      10
    );
    if (!payload.appointment) {
      delete payload.appointment;
    } else {
      payload.appointment = parseInt(payload.appointment, 10);
    }

    if (isEditing) {
      if (currentUser.role === USER_ROLES.PATIENT) {
        const patientPayload = { patient_feedback: payload.patient_feedback };
        payload = patientPayload; // Reassign payload
      } else if (currentUser.role === USER_ROLES.DOCTOR) {
        const doctorPayload = {
          status: payload.status,
          doctor_notes: payload.doctor_notes,
          session_url: payload.session_url,
          session_end_time: payload.session_end_time,
        };
        if (formData.reason_for_consultation)
          doctorPayload.reason_for_consultation =
            formData.reason_for_consultation;
        if (formData.estimated_duration_minutes)
          doctorPayload.estimated_duration_minutes =
            formData.estimated_duration_minutes;
        if (formData.session_start_time)
          doctorPayload.session_start_time = formData.session_start_time;
        payload = doctorPayload; // Reassign payload
      }
    }

    try {
      if (isEditing) {
        await updateTelemedicineSession(sessionId, payload);
        setSuccess("Telemedicine session updated successfully!");
      } else {
        await createTelemedicineSession(payload);
        setSuccess("Telemedicine session scheduled successfully!");
        setFormData({
          patient:
            currentUser?.role === USER_ROLES.PATIENT ? currentUser.id : "",
          doctor: "",
          appointment: "",
          session_start_time: new Date(new Date().setMinutes(0))
            .toISOString()
            .slice(0, 16),
          estimated_duration_minutes: 30,
          session_url: "",
          status: "SCHEDULED",
          reason_for_consultation: "",
          doctor_notes: "",
          patient_feedback: "",
        });
      }
      if (onFormSubmitSuccess) {
        onFormSubmitSuccess();
      }
    } catch (err) {
      setError(
        err.message || `Failed to ${isEditing ? "update" : "schedule"} session.`
      );
      console.error("Error submitting telemedicine form:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (
    isLoading &&
    doctors.length === 0 &&
    (currentUser?.role !== USER_ROLES.PATIENT || isEditing)
  ) {
    return (
      <LoadingSpinner
        message={isEditing ? "Loading session details..." : "Loading form..."}
      />
    );
  }

  const canEditSensitiveFields =
    currentUser &&
    (currentUser.role === USER_ROLES.ADMIN ||
      currentUser.role === USER_ROLES.RECEPTIONIST ||
      (currentUser.role === USER_ROLES.DOCTOR && !isEditing) ||
      (currentUser.role === USER_ROLES.DOCTOR && isEditing));
  const isPatientEditingFeedback =
    isEditing && currentUser?.role === USER_ROLES.PATIENT;

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h4 className="mb-0">
          {isEditing
            ? "Edit Telemedicine Session"
            : "Schedule New Telemedicine Session"}
        </h4>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {currentUser &&
            currentUser.role !== USER_ROLES.PATIENT &&
            !isPatientEditingFeedback && (
              <div className="mb-3">
                <label htmlFor="tele_patient" className="form-label">
                  Patient <span className="text-danger">*</span>
                </label>
                <select
                  id="tele_patient"
                  name="patient"
                  className="form-select"
                  value={formData.patient}
                  onChange={handleChange}
                  required
                  disabled={
                    patients.length === 0 ||
                    isLoading ||
                    (isEditing &&
                      !canEditSensitiveFields &&
                      currentUser.role !== USER_ROLES.ADMIN &&
                      currentUser.role !== USER_ROLES.RECEPTIONIST)
                  }
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.user.id} value={p.user.id}>
                      {p.user.first_name} {p.user.last_name} (ID: {p.user.id})
                    </option>
                  ))}
                </select>
              </div>
            )}
          {currentUser && currentUser.role === USER_ROLES.PATIENT && (
            <input type="hidden" name="patient" value={formData.patient} />
          )}

          {!isPatientEditingFeedback && (
            <div className="mb-3">
              <label htmlFor="tele_doctor" className="form-label">
                Doctor <span className="text-danger">*</span>
              </label>
              <select
                id="tele_doctor"
                name="doctor"
                className="form-select"
                value={formData.doctor}
                onChange={handleChange}
                required
                disabled={
                  doctors.length === 0 ||
                  isLoading ||
                  (isEditing &&
                    !canEditSensitiveFields &&
                    currentUser.role !== USER_ROLES.ADMIN &&
                    currentUser.role !== USER_ROLES.RECEPTIONIST)
                }
              >
                <option value="">Select Doctor</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.first_name} {doc.last_name} (
                    {doc.profile?.specialization || "General"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isPatientEditingFeedback &&
            (currentUser.role === USER_ROLES.ADMIN ||
              currentUser.role === USER_ROLES.RECEPTIONIST ||
              currentUser.role === USER_ROLES.DOCTOR) && (
              <div className="mb-3">
                <label htmlFor="tele_appointment_link" className="form-label">
                  Link to Existing Telemedicine Appointment (Optional)
                </label>
                <select
                  id="tele_appointment_link"
                  name="appointment"
                  className="form-select"
                  value={formData.appointment}
                  onChange={handleChange}
                  disabled={isLoading || (isEditing && !canEditSensitiveFields)}
                >
                  <option value="">None (Ad-hoc Session)</option>
                  {telemedicineAppointments.map((appt) => (
                    <option key={appt.id} value={appt.id}>
                      Appt ID: {appt.id} - Patient:{" "}
                      {appt.patient_details.user.first_name}{" "}
                      {appt.patient_details.user.last_name} - Dr.{" "}
                      {appt.doctor_details.first_name}{" "}
                      {appt.doctor_details.last_name} (
                      {new Date(
                        appt.appointment_date_time
                      ).toLocaleDateString()}
                      )
                    </option>
                  ))}
                </select>
                <small className="form-text text-muted">
                  Selecting an appointment will auto-fill patient, doctor, and
                  start time.
                </small>
              </div>
            )}

          {!isPatientEditingFeedback && (
            <div className="mb-3">
              <label htmlFor="session_start_time" className="form-label">
                Session Start Time <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                className="form-control"
                id="session_start_time"
                name="session_start_time"
                value={formData.session_start_time}
                onChange={handleChange}
                required
                disabled={isEditing && !canEditSensitiveFields}
              />
            </div>
          )}

          {!isPatientEditingFeedback && (
            <div className="mb-3">
              <label
                htmlFor="estimated_duration_minutes"
                className="form-label"
              >
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                className="form-control"
                id="estimated_duration_minutes"
                name="estimated_duration_minutes"
                value={formData.estimated_duration_minutes}
                onChange={handleChange}
                min="5"
                step="5"
                disabled={isEditing && !canEditSensitiveFields}
              />
            </div>
          )}

          {(currentUser.role === USER_ROLES.DOCTOR ||
            currentUser.role === USER_ROLES.ADMIN ||
            currentUser.role === USER_ROLES.RECEPTIONIST) &&
            !isPatientEditingFeedback && (
              <div className="mb-3">
                <label htmlFor="session_url" className="form-label">
                  Session URL
                </label>
                <input
                  type="url"
                  className="form-control"
                  id="session_url"
                  name="session_url"
                  value={formData.session_url}
                  onChange={handleChange}
                  placeholder="https://meet.example.com/session123"
                  disabled={
                    isEditing &&
                    !canEditSensitiveFields &&
                    currentUser.role !== USER_ROLES.DOCTOR
                  }
                />
              </div>
            )}

          {isEditing &&
            (currentUser.role === USER_ROLES.DOCTOR ||
              currentUser.role === USER_ROLES.ADMIN ||
              currentUser.role === USER_ROLES.RECEPTIONIST) &&
            !isPatientEditingFeedback && (
              <div className="mb-3">
                <label htmlFor="tele_status" className="form-label">
                  Session Status
                </label>
                <select
                  id="tele_status"
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {SESSION_STATUS_CHOICES_STAFF.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {!isPatientEditingFeedback && (
            <div className="mb-3">
              <label htmlFor="reason_for_consultation" className="form-label">
                Reason for Consultation
              </label>
              <textarea
                className="form-control"
                id="reason_for_consultation"
                name="reason_for_consultation"
                rows="3"
                value={formData.reason_for_consultation}
                onChange={handleChange}
                disabled={isEditing && !canEditSensitiveFields}
              ></textarea>
            </div>
          )}

          {isEditing && currentUser.role === USER_ROLES.DOCTOR && (
            <div className="mb-3">
              <label htmlFor="doctor_notes" className="form-label">
                Doctor's Notes (Post-Session)
              </label>
              <textarea
                className="form-control"
                id="doctor_notes"
                name="doctor_notes"
                rows="3"
                value={formData.doctor_notes}
                onChange={handleChange}
              ></textarea>
            </div>
          )}

          {isPatientEditingFeedback && formData.status === "COMPLETED" && (
            <div className="mb-3">
              <label htmlFor="patient_feedback" className="form-label">
                Your Feedback (Post-Session)
              </label>
              <textarea
                className="form-control"
                id="patient_feedback"
                name="patient_feedback"
                rows="3"
                value={formData.patient_feedback}
                onChange={handleChange}
              ></textarea>
            </div>
          )}

          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-outline-secondary me-2"
              onClick={() =>
                navigate(
                  isEditing
                    ? `/telemedicine/sessions/${sessionId}`
                    : "/telemedicine/sessions"
                )
              }
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading
                ? isEditing
                  ? "Updating..."
                  : "Scheduling..."
                : isEditing
                ? "Update Session"
                : "Schedule Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TelemedicineForm;
