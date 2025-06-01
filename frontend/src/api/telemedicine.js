// src/api/telemedicine.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Lists telemedicine sessions. Filters based on user role are handled by the backend.
 * Patient: Sees their own sessions.
 * Doctor: Sees their own or linked sessions.
 * Receptionist, Admin, Nurse (read-only for nurse): Can see more broadly.
 * @param {object} params - Optional query parameters for filtering (e.g., patient_id, doctor_id, status, date).
 * @returns {Promise<Array<object>>} A list of telemedicine session objects.
 */
export const listTelemedicineSessions = async (params = {}) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/telemedicine/${queryParams ? `?${queryParams}` : ''}`;

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
    console.error('Failed to list telemedicine sessions:', error);
    throw error;
  }
};

/**
 * Creates a new telemedicine session.
 * Accessible by Patient (if allowed for self-booking), Doctor, Receptionist, Admin.
 * @param {object} sessionData - Data for the new session.
 * Required: patient (ID), doctor (ID), session_start_time.
 * Optional: appointment (ID to link), estimated_duration_minutes, session_url, reason_for_consultation, status.
 * @returns {Promise<object>} The created telemedicine session object.
 */
export const createTelemedicineSession = async (sessionData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/telemedicine/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(sessionData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create telemedicine session:', error);
    throw error;
  }
};

/**
 * Retrieves details of a specific telemedicine session.
 * @param {number} sessionId - The ID of the telemedicine session.
 * @returns {Promise<object>} The telemedicine session object.
 */
export const getTelemedicineSessionDetails = async (sessionId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/telemedicine/${sessionId}/`, {
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
    console.error(`Failed to retrieve telemedicine session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific telemedicine session.
 * Patient: Can update patient_feedback.
 * Doctor: Can update their sessions (status, notes, URL, end time).
 * Receptionist, Admin: Full update access.
 * @param {number} sessionId - The ID of the session to update.
 * @param {object} sessionData - The data to update.
 * @returns {Promise<object>} The updated telemedicine session object.
 */
export const updateTelemedicineSession = async (sessionId, sessionData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/telemedicine/${sessionId}/`, {
      method: 'PATCH', // PATCH for partial updates
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(sessionData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update telemedicine session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Deletes (cancels) a specific telemedicine session.
 * Admin: Hard delete.
 * Receptionist, Doctor: Marks status as CANCELLED.
 * @param {number} sessionId - The ID of the session.
 * @returns {Promise<object|void>} Response data (e.g., updated session if cancelled) or nothing if hard deleted.
 */
export const deleteTelemedicineSession = async (sessionId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/telemedicine/${sessionId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      if (response.status === 204) return; // Successful hard delete
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 200) { // Successful cancel, backend returns updated session
        return await response.json();
    }
    return; // For 204 No Content
  } catch (error) {
    console.error(`Failed to delete/cancel telemedicine session ${sessionId}:`, error);
    throw error;
  }
};
