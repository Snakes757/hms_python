import React, { useState, useEffect, useContext } from "react";
import {
  createTelemedicineSession,
  updateTelemedicineSession,
  getTelemedicineSessionDetails,
} from "../../api/telemedicine";
import { getActiveDoctors } from "../../api/appointments"; // Assuming this still fetches users with role DOCTOR
import { listAllPatients } from "../../api/patients";
import { listAppointments } from "../../api/appointments";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate }
from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";
import { USER_ROLES, TELEMEDICINE_SESSION_STATUS as SESSION_STATUS_CONSTANTS } from "../../utils/constants"; // Renamed for clarity

const SESSION_STATUS_CHOICES_STAFF = Object.entries(SESSION_STATUS_CONSTANTS).map(([key, value]) => ({
    value: key, // Store the key e.g., 'SCHEDULED'
    label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) // Format for display e.g., "Scheduled"
}));


const TelemedicineForm = ({ sessionId, onFormSubmitSuccess }) => {
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const initialFormData = {
    patient: "",
    doctor: "",
    appointment: "", // ID of an existing 'TELEMEDICINE' type appointment
    session_start_time: new Date(new Date().setMinutes(0,0,0) + 60 * 60 * 1000) // Default to next hour
      .toISOString()
      .slice(0, 16),
    estimated_duration_minutes: 30,
    session_url: "", // Optional, can be auto-generated or manually entered
    status: SESSION_STATUS_CONSTANTS.SCHEDULED,
    reason_for_consultation: "",
    doctor_notes: "", // For doctors to fill post-session
    patient_feedback: "", // For patients to fill post-session
  };

  const [formData, setFormData] = useState(initialFormData);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [telemedicineAppointments, setTelemedicineAppointments] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = Boolean(sessionId);

  // Common Tailwind classes
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed";
  const buttonPrimaryClasses = "px-6 py-2.5 bg-blue-600 text-white font-medium text-sm leading-tight uppercase rounded-md shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out disabled:opacity-50";
  const buttonSecondaryClasses = "px-6 py-2.5 bg-gray-200 text-gray-700 font-medium text-sm leading-tight uppercase rounded-md shadow-md hover:bg-gray-300 hover:shadow-lg focus:bg-gray-300 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-400 active:shadow-lg transition duration-150 ease-in-out";


  useEffect(() => {
    const loadSupportData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      setError("");
      try {
        const doctorsData = await getActiveDoctors(); // Fetches users with role DOCTOR and is_active=true
        setDoctors(doctorsData || []);

        if (
          currentUser.role === USER_ROLES.ADMIN ||
          currentUser.role === USER_ROLES.RECEPTIONIST ||
          currentUser.role === USER_ROLES.DOCTOR
        ) {
          const patientsData = await listAllPatients();
          setPatients(patientsData?.results || patientsData || []);

          // Fetch appointments that are of type 'TELEMEDICINE' and don't yet have a telemedicine session linked
          const apptParams = {
            appointment_type: "TELEMEDICINE",
            // Assuming your backend can filter for appointments without a session
            // This might need a specific filter like `telemedicine_session__isnull=true`
            // or you might need to filter client-side if not possible.
            // For now, let's assume it fetches all TELEMEDICINE appointments and we filter if needed.
          };
          const availableApptsData = await listAppointments(apptParams);
          // Further filter if backend doesn't support `telemedicine_session__isnull=true`
          // This is a placeholder; actual filtering depends on your `appointment` model structure
          const unlinkedTelemedicineAppts = (availableApptsData?.results || availableApptsData || []).filter(
            appt => !appt.telemedicine_session_details || Object.keys(appt.telemedicine_session_details).length === 0
          );
          setTelemedicineAppointments(unlinkedTelemedicineAppts);

        } else if (currentUser.role === USER_ROLES.PATIENT) {
          setFormData((prev) => ({ ...prev, patient: currentUser.id.toString() }));
          // Patients might also need to see their own unlinked telemedicine appointments
           const patientApptParams = {
            appointment_type: "TELEMEDICINE",
            patient__user__id: currentUser.id,
          };
          const patientApptsData = await listAppointments(patientApptParams);
           const unlinkedPatientAppts = (patientApptsData?.results || patientApptsData || []).filter(
            appt => !appt.telemedicine_session_details || Object.keys(appt.telemedicine_session_details).length === 0
          );
          setTelemedicineAppointments(unlinkedPatientAppts);
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
            patient: data.patient_details?.user?.id.toString() || "",
            doctor: data.doctor_details?.id.toString() || "",
            appointment: data.appointment?.toString() || "",
            session_start_time: data.session_start_time ? new Date(data.session_start_time).toISOString().slice(0, 16) : initialFormData.session_start_time,
            estimated_duration_minutes: data.estimated_duration_minutes || 30,
            session_url: data.session_url || "",
            status: data.status || SESSION_STATUS_CONSTANTS.SCHEDULED,
            reason_for_consultation: data.reason_for_consultation || "",
            doctor_notes: data.doctor_notes || "",
            patient_feedback: data.patient_feedback || "",
          });
          // If the linked appointment is not in the current list, add it (e.g., if it was already linked)
          if (data.appointment_details && !telemedicineAppointments.find(a => a.id === data.appointment_details.id)) {
            setTelemedicineAppointments(prev => [data.appointment_details, ...prev.filter(a => a.id !== data.appointment_details.id)]);
          }
        })
        .catch((err) => setError("Failed to load session details: " + err.message))
        .finally(() => setIsLoading(false));
    }
  }, [sessionId, isEditing]);


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
          patient: selectedAppt.patient_details?.user?.id.toString() || "",
          doctor: selectedAppt.doctor_details?.id.toString() || "",
          session_start_time: new Date(selectedAppt.appointment_date_time).toISOString().slice(0, 16),
          reason_for_consultation: selectedAppt.reason || prev.reason_for_consultation,
          estimated_duration_minutes: selectedAppt.estimated_duration_minutes || prev.estimated_duration_minutes,
        }));
      }
    } else if (name === "appointment" && !value) { // If "None" is selected for appointment
        setFormData(prev => ({
            ...prev,
            patient: (currentUser?.role === USER_ROLES.PATIENT) ? currentUser.id.toString() : "",
            doctor: "",
            // session_start_time: initialFormData.session_start_time, // Reset or keep as is?
            // reason_for_consultation: "", // Reset or keep?
            // estimated_duration_minutes: 30, // Reset or keep?
        }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    let payload = { ...formData };
    payload.patient = parseInt(payload.patient, 10);
    payload.doctor = parseInt(payload.doctor, 10);
    payload.estimated_duration_minutes = parseInt(payload.estimated_duration_minutes, 10);

    if (!payload.appointment) {
      delete payload.appointment;
    } else {
      payload.appointment = parseInt(payload.appointment, 10);
    }
    
    // Ensure empty strings are sent as null if API expects that for optional fields
    ['session_url', 'reason_for_consultation', 'doctor_notes', 'patient_feedback'].forEach(key => {
        if (payload[key] === "") payload[key] = null;
    });


    // Specific payload adjustments for editing based on role
    if (isEditing) {
      if (currentUser.role === USER_ROLES.PATIENT) {
        const patientPayload = { patient_feedback: payload.patient_feedback };
        payload = patientPayload; // Only allow patient to update feedback
      } else if (currentUser.role === USER_ROLES.DOCTOR) {
        // Doctors can update status, notes, URL. Other fields might be restricted post-creation.
        const doctorPayload = {
          status: payload.status,
          doctor_notes: payload.doctor_notes,
          session_url: payload.session_url,
          // session_end_time: payload.session_end_time, // If you add this field
        };
        // Allow updating these if they were part of the original form for doctors
        if (formData.reason_for_consultation) doctorPayload.reason_for_consultation = formData.reason_for_consultation;
        if (formData.estimated_duration_minutes) doctorPayload.estimated_duration_minutes = formData.estimated_duration_minutes;
        if (formData.session_start_time) doctorPayload.session_start_time = formData.session_start_time;

        payload = doctorPayload;
      }
      // Admins/Receptionists might have full edit access to payload as constructed.
    }


    try {
      if (isEditing) {
        await updateTelemedicineSession(sessionId, payload);
        setSuccess("Telemedicine session updated successfully!");
      } else {
        await createTelemedicineSession(payload);
        setSuccess("Telemedicine session scheduled successfully!");
        setFormData(initialFormData); // Reset form on successful creation
      }
      if (onFormSubmitSuccess) { // Callback for parent component
        onFormSubmitSuccess();
      } else { // Default navigation if no callback
        setTimeout(() => navigate(isEditing ? `/telemedicine/sessions/${sessionId}` : '/telemedicine/sessions'), 2000);
      }
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? "update" : "schedule"} session.`);
      console.error("Error submitting telemedicine form:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && doctors.length === 0 && (currentUser?.role !== USER_ROLES.PATIENT || isEditing)) {
    return <div className="flex justify-center items-center p-10"><LoadingSpinner message={isEditing ? "Loading session details..." : "Loading form..."} /></div>;
  }

  // Determine which fields are editable based on role and mode (create/edit)
  const canEditCoreFields = !isEditing || (currentUser && (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST));
  const canDoctorEditSomeFields = isEditing && currentUser?.role === USER_ROLES.DOCTOR;


  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl">
      <h3 className="text-2xl font-semibold text-gray-800 mb-2">
        {isEditing ? "Edit Telemedicine Session" : "Schedule New Telemedicine Session"}
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        {isEditing ? "Update the details for the telemedicine session." : "Fill out the details below to schedule a new telemedicine session. Please select the patient and doctor, and confirm the date and time."}
      </p>

      {error && <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection: Visible to staff */}
        {currentUser && currentUser.role !== USER_ROLES.PATIENT && (
          <div>
            <label htmlFor="tele_patient" className={labelClasses}>Patient <span className="text-red-500">*</span></label>
            <select id="tele_patient" name="patient" className={inputClasses} value={formData.patient} onChange={handleChange} required disabled={patients.length === 0 || isLoading || !canEditCoreFields}>
              <option value="">Select Patient</option>
              {patients.map((p) => (<option key={p.user.id} value={p.user.id.toString()}>{p.user.first_name} {p.user.last_name} (ID: {p.user.id})</option>))}
            </select>
          </div>
        )}
        {/* Hidden patient input for logged-in patients */}
        {currentUser && currentUser.role === USER_ROLES.PATIENT && <input type="hidden" name="patient" value={formData.patient} />}

        {/* Doctor Selection */}
        <div>
          <label htmlFor="tele_doctor" className={labelClasses}>Doctor <span className="text-red-500">*</span></label>
          <select id="tele_doctor" name="doctor" className={inputClasses} value={formData.doctor} onChange={handleChange} required disabled={doctors.length === 0 || isLoading || !canEditCoreFields}>
            <option value="">Select Doctor</option>
            {doctors.map((doc) => (<option key={doc.id} value={doc.id.toString()}>Dr. {doc.first_name} {doc.last_name} ({doc.profile?.specialization || "General"})</option>))}
          </select>
        </div>

        {/* Link to Existing Appointment (Optional) */}
         <div>
            <label htmlFor="tele_appointment_link" className={labelClasses}>Link to Existing Telemedicine Appointment (Optional)</label>
            <select id="tele_appointment_link" name="appointment" className={inputClasses} value={formData.appointment} onChange={handleChange} disabled={isLoading || !canEditCoreFields}>
              <option value="">None (Ad-hoc Session)</option>
              {telemedicineAppointments.map(appt => (
                <option key={appt.id} value={appt.id.toString()}>
                  Appt ID: {appt.id} - Patient: {appt.patient_details?.user?.first_name} {appt.patient_details?.user?.last_name} - Dr. {appt.doctor_details?.first_name} {appt.doctor_details?.last_name} ({new Date(appt.appointment_date_time).toLocaleDateString()})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Selecting an appointment will auto-fill patient, doctor, and start time.</p>
        </div>


        {/* Session Start Time */}
        <div>
          <label htmlFor="session_start_time" className={labelClasses}>Session Start Time <span className="text-red-500">*</span></label>
          <input type="datetime-local" id="session_start_time" name="session_start_time" className={inputClasses} value={formData.session_start_time} onChange={handleChange} required disabled={isLoading || (!canEditCoreFields && !canDoctorEditSomeFields)} />
        </div>

        {/* Estimated Duration */}
        <div>
          <label htmlFor="estimated_duration_minutes" className={labelClasses}>Estimated Duration (minutes)</label>
          <input type="number" id="estimated_duration_minutes" name="estimated_duration_minutes" className={inputClasses} value={formData.estimated_duration_minutes} onChange={handleChange} min="5" step="5" disabled={isLoading || (!canEditCoreFields && !canDoctorEditSomeFields)} />
        </div>

        {/* Session URL: Editable by staff/doctor */}
        {(currentUser.role === USER_ROLES.DOCTOR || currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST) && (
        <div>
          <label htmlFor="session_url" className={labelClasses}>Session URL</label>
          <input type="url" id="session_url" name="session_url" className={inputClasses} value={formData.session_url} onChange={handleChange} placeholder="https://meet.example.com/session123" disabled={isLoading || (!canEditCoreFields && !canDoctorEditSomeFields)} />
        </div>
        )}

        {/* Status: Editable by staff/doctor during edit mode */}
        {isEditing && (currentUser.role === USER_ROLES.DOCTOR || currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST) && (
          <div>
            <label htmlFor="tele_status" className={labelClasses}>Session Status</label>
            <select id="tele_status" name="status" className={inputClasses} value={formData.status} onChange={handleChange} disabled={isLoading}>
              {SESSION_STATUS_CHOICES_STAFF.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
        )}

        {/* Reason for Consultation */}
        <div>
          <label htmlFor="reason_for_consultation" className={labelClasses}>Reason for Consultation</label>
          <textarea id="reason_for_consultation" name="reason_for_consultation" rows="3" className={inputClasses} value={formData.reason_for_consultation} onChange={handleChange} disabled={isLoading || (isEditing && !canEditCoreFields && !canDoctorEditSomeFields)}></textarea>
        </div>

        {/* Doctor's Notes: Editable by Doctor during edit mode */}
        {isEditing && currentUser.role === USER_ROLES.DOCTOR && (
          <div>
            <label htmlFor="doctor_notes" className={labelClasses}>Doctor's Notes (Post-Session)</label>
            <textarea id="doctor_notes" name="doctor_notes" rows="3" className={inputClasses} value={formData.doctor_notes} onChange={handleChange} disabled={isLoading}></textarea>
          </div>
        )}

        {/* Patient Feedback: Editable by Patient for completed sessions */}
        {isEditing && currentUser.role === USER_ROLES.PATIENT && formData.status === SESSION_STATUS_CONSTANTS.COMPLETED && (
          <div>
            <label htmlFor="patient_feedback" className={labelClasses}>Your Feedback (Post-Session)</label>
            <textarea id="patient_feedback" name="patient_feedback" rows="3" className={inputClasses} value={formData.patient_feedback} onChange={handleChange} placeholder="Share your experience..." disabled={isLoading}></textarea>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" className={buttonSecondaryClasses} onClick={() => navigate(isEditing ? `/telemedicine/sessions/${sessionId}` : '/telemedicine/sessions')} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className={buttonPrimaryClasses} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" spinnerColor="text-white" textColor="text-white" /> : (isEditing ? "Update Session" : "Schedule Session")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TelemedicineForm;
