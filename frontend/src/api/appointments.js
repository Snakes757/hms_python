// src/api/appointments.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const listAppointments = async (params = {}) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/appointments/${queryParams ? `?${queryParams}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results || data; // Handle paginated or non-paginated response
  } catch (error) {
    console.error('Failed to list appointments:', error);
    throw error;
  }
};

/**
 * Creates a new appointment.
 * Accessible by Patient (for self), Doctor, Nurse, Receptionist, Admin.
 * @param {object} appointmentData - Data for the new appointment.
 * Required fields: patient (ID), doctor (ID), appointment_type, appointment_date_time.
 * Optional: estimated_duration_minutes, reason, notes.
 * `scheduled_by` is usually set by the backend based on the authenticated user.
 * @returns {Promise<object>} The created appointment object.
 */
export const createAppointment = async (appointmentData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(appointmentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      // Construct a more detailed error message if possible
      let detailedMessage = `HTTP error! status: ${response.status}`;
      if (errorData) {
          if (errorData.detail) {
              detailedMessage = errorData.detail;
          } else {
              const messages = Object.entries(errorData).map(([field, msgs]) => {
                  return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
              }).join('; ');
              if (messages) detailedMessage = messages;
          }
      }
      throw new Error(detailedMessage);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create appointment:', error);
    throw error;
  }
};

/**
 * Retrieves details of a specific appointment.
 * @param {number} appointmentId - The ID of the appointment.
 * @returns {Promise<object>} The appointment object.
 */
export const getAppointmentDetails = async (appointmentId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to retrieve appointment ${appointmentId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific appointment.
 * Permissions vary by role and field.
 * Patient: Can only update status to CANCELLED_BY_PATIENT.
 * Doctor: Can update their own appointments (status, notes, etc.).
 * Receptionist, Admin: Full update access.
 * @param {number} appointmentId - The ID of the appointment to update.
 * @param {object} appointmentData - The data to update.
 * @returns {Promise<object>} The updated appointment object.
 */
export const updateAppointment = async (appointmentId, appointmentData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/`, {
      method: 'PATCH', // PATCH for partial updates
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(appointmentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      let detailedMessage = `HTTP error! status: ${response.status}`;
      if (errorData) {
          if (errorData.detail) {
              detailedMessage = errorData.detail;
          } else {
              const messages = Object.entries(errorData).map(([field, msgs]) => {
                  return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
              }).join('; ');
              if (messages) detailedMessage = messages;
          }
      }
      throw new Error(detailedMessage);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update appointment ${appointmentId}:`, error);
    throw error;
  }
};

/**
 * Deletes (or cancels) a specific appointment.
 * Admin: Hard delete.
 * Receptionist, Doctor: Marks status as CANCELLED_BY_STAFF.
 * @param {number} appointmentId - The ID of the appointment.
 * @returns {Promise<object|void>} Response data (e.g., updated appointment if cancelled) or nothing if hard deleted.
 */
export const deleteAppointment = async (appointmentId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      if (response.status === 204) return; // No content is a success for DELETE (hard delete)
      // If not 204, it might be a soft delete (cancel) returning the updated object or an error
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    // If status is 200, it means it was a soft delete (cancel) and backend returned the updated appointment
    if (response.status === 200) {
        return await response.json();
    }
    // If 204, it was a hard delete
    return; 
  } catch (error) {
    console.error(`Failed to delete/cancel appointment ${appointmentId}:`, error);
    throw error;
  }
};

// Helper function to fetch active doctors for appointment scheduling
export const getActiveDoctors = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return Promise.reject(new Error("Token required"));

    // Assuming the /api/v1/users/ endpoint can be filtered by role=DOCTOR and is_active=true
    // Or, a dedicated endpoint like /api/v1/doctors/ might exist.
    // For this example, we use the users endpoint with query params.
    try {
        const response = await fetch(`${API_BASE_URL}/users/?role=DOCTOR&is_active=true`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch doctors');
        const data = await response.json();
        return data.results || data; // Handle pagination
    } catch (error) {
        console.error("Error fetching doctors:", error);
        throw error;
    }
};
