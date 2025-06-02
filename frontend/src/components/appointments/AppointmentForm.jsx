import React, { useState, useEffect, useContext } from 'react';
import { createAppointment, updateAppointment, getAppointmentDetails, getActiveDoctors } from '../../api/appointments';
import { listAllPatients } from '../../api/patients';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import { USER_ROLES } from '../../utils/constants'; // Assuming USER_ROLES is correctly imported

const APPOINTMENT_TYPES = [
    { value: 'GENERAL_CONSULTATION', label: 'General Consultation' },
    { value: 'SPECIALIST_VISIT', label: 'Specialist Visit' },
    { value: 'FOLLOW_UP', label: 'Follow-up' },
    { value: 'TELEMEDICINE', label: 'Telemedicine' },
    { value: 'PROCEDURE', label: 'Procedure' },
    { value: 'CHECK_UP', label: 'Check-up' },
    { value: 'EMERGENCY', label: 'Emergency' },
];

const APPOINTMENT_STATUS_CHOICES_STAFF = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'NO_SHOW', label: 'No Show' },
    { value: 'CANCELLED_BY_STAFF', label: 'Cancelled by Staff' },
    // CANCELLED_BY_PATIENT is typically handled by patient action, not staff selection in form
];

const AppointmentForm = ({ appointmentId }) => {
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    appointment_type: APPOINTMENT_TYPES[0].value,
    appointment_date_time: new Date(new Date().setMinutes(0)).toISOString().slice(0, 16),
    estimated_duration_minutes: 30,
    status: 'SCHEDULED',
    reason: '',
    notes: '',
  });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = Boolean(appointmentId);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const doctorsData = await getActiveDoctors();
        setDoctors(doctorsData || []);

        if (currentUser && (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST || currentUser.role === USER_ROLES.DOCTOR || currentUser.role === USER_ROLES.NURSE)) {
          const patientsData = await listAllPatients();
          setPatients(patientsData?.results || patientsData || []); // Handle paginated or direct array
        } else if (currentUser && currentUser.role === USER_ROLES.PATIENT) {
          setFormData(prev => ({ ...prev, patient: currentUser.id.toString() }));
        }

        if (isEditing) {
          const apptDetails = await getAppointmentDetails(appointmentId);
          setFormData({
            patient: apptDetails.patient_details.user.id.toString(),
            doctor: apptDetails.doctor_details.id.toString(),
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
        console.error("Error in AppointmentForm loadInitialData:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) { // Only load if currentUser is available
        loadInitialData();
    }
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
    payload.patient = parseInt(payload.patient, 10);
    payload.doctor = parseInt(payload.doctor, 10);
    payload.estimated_duration_minutes = parseInt(payload.estimated_duration_minutes, 10);

    try {
      if (isEditing) {
        await updateAppointment(appointmentId, payload);
        setSuccess('Appointment updated successfully!');
        // navigate(`/appointments/${appointmentId}`, { replace: true }); // Or let parent page handle redirect
      } else {
        await createAppointment(payload);
        setSuccess('Appointment scheduled successfully!');
        setFormData({ // Reset form for new entry
            patient: currentUser?.role === USER_ROLES.PATIENT ? currentUser.id.toString() : '',
            doctor: '', appointment_type: APPOINTMENT_TYPES[0].value,
            appointment_date_time: new Date(new Date().setMinutes(0)).toISOString().slice(0, 16),
            estimated_duration_minutes: 30, status: 'SCHEDULED', reason: '', notes: ''
        });
      }
    } catch (err) {
      const errorMessage = err.message || `Failed to ${isEditing ? 'update' : 'schedule'} appointment.`;
      setError(errorMessage);
      console.error("Error submitting appointment form:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900";
  const labelBaseClasses = "block text-sm font-medium text-gray-700 mb-1";

  if (isLoading && ((!isEditing && doctors.length === 0) || (isEditing && !formData.doctor)) ) {
    return <LoadingSpinner message={isEditing ? "Loading appointment details..." : "Loading form..."} />;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        {isEditing ? 'Edit Appointment' : 'Schedule New Appointment'}
      </h3>
      {error && <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md text-sm">{success}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {currentUser && (currentUser.role !== USER_ROLES.PATIENT) && (
          <div>
            <label htmlFor="patient" className={labelBaseClasses}>Patient <span className="text-red-500">*</span></label>
            <select
              id="patient"
              name="patient"
              className={inputBaseClasses}
              value={formData.patient}
              onChange={handleChange}
              required
              disabled={patients.length === 0 || isLoading}
            >
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.user.id} value={p.user.id.toString()}>
                  {p.user.first_name} {p.user.last_name} (ID: {p.user.id})
                </option>
              ))}
            </select>
            {patients.length === 0 && !isLoading && <small className="text-xs text-gray-500">Loading patients or no patients available.</small>}
          </div>
        )}
         {currentUser && currentUser.role === USER_ROLES.PATIENT && (
           <input type="hidden" name="patient" value={formData.patient} />
         )}

        <div>
          <label htmlFor="doctor" className={labelBaseClasses}>Doctor <span className="text-red-500">*</span></label>
          <select
            id="doctor"
            name="doctor"
            className={inputBaseClasses}
            value={formData.doctor}
            onChange={handleChange}
            required
            disabled={doctors.length === 0 || isLoading}
          >
            <option value="">Select Doctor</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id.toString()}>
                Dr. {doc.first_name} {doc.last_name} ({doc.profile?.specialization || 'General Practitioner'})
              </option>
            ))}
          </select>
          {doctors.length === 0 && !isLoading && <small className="text-xs text-gray-500">Loading doctors or no doctors available.</small>}
        </div>

        <div>
          <label htmlFor="appointment_type" className={labelBaseClasses}>Appointment Type <span className="text-red-500">*</span></label>
          <select id="appointment_type" name="appointment_type" className={inputBaseClasses} value={formData.appointment_type} onChange={handleChange} required>
            {APPOINTMENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="appointment_date_time" className={labelBaseClasses}>Date and Time <span className="text-red-500">*</span></label>
          <input
            type="datetime-local"
            className={inputBaseClasses}
            id="appointment_date_time"
            name="appointment_date_time"
            value={formData.appointment_date_time}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="estimated_duration_minutes" className={labelBaseClasses}>Estimated Duration (minutes)</label>
          <input
            type="number"
            className={inputBaseClasses}
            id="estimated_duration_minutes"
            name="estimated_duration_minutes"
            value={formData.estimated_duration_minutes}
            onChange={handleChange}
            min="5"
            step="5"
          />
        </div>

        {isEditing && currentUser && (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST || currentUser.role === USER_ROLES.DOCTOR) && (
          <div>
              <label htmlFor="status" className={labelBaseClasses}>Status</label>
              <select id="status" name="status" className={inputBaseClasses} value={formData.status} onChange={handleChange}>
                  {APPOINTMENT_STATUS_CHOICES_STAFF.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
              </select>
          </div>
        )}

        <div>
          <label htmlFor="reason" className={labelBaseClasses}>Reason for Appointment</label>
          <textarea className={inputBaseClasses} id="reason" name="reason" rows="3" value={formData.reason} onChange={handleChange}></textarea>
        </div>

        {currentUser && (currentUser.role !== USER_ROLES.PATIENT) && (
          <div>
            <label htmlFor="notes" className={labelBaseClasses}>Internal Notes</label>
            <textarea className={inputBaseClasses} id="notes" name="notes" rows="3" value={formData.notes} onChange={handleChange}></textarea>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => navigate(isEditing ? `/appointments/${appointmentId}` : '/appointments')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : (isEditing ? 'Update Appointment' : 'Schedule Appointment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
