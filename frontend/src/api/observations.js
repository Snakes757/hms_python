// src/api/observations.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';

/**
 * Lists all observations for a specific patient.
 * Accessible by Patient (own), Doctor, Nurse, Admin.
 * @param {number} patientUserId - The user ID of the patient.
 * @returns {Promise<Array<object>>} A list of observation objects.
 */
export const listObservationsForPatient = async (patientUserId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/observations/`, {
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
    console.error(`Failed to list observations for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Creates a new observation for a patient.
 * Accessible by Doctor, Nurse.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {object} observationData - Data for the new observation.
 * Fields: observation_date_time, symptoms_observed, vital_signs (JSON), description, notes.
 * Optional: appointment (ID), medical_record (ID).
 * `observed_by` is set by the backend.
 * @returns {Promise<object>} The created observation object.
 */
export const createObservation = async (patientUserId, observationData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Doctor/Nurse access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/observations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(observationData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to create observation for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Retrieves details of a specific observation.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the observation.
 * @returns {Promise<object>} The observation object.
 */
export const getObservationDetail = async (patientUserId, recordId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/observations/${recordId}/`, {
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
    console.error(`Failed to retrieve observation ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific observation.
 * Accessible by Doctor, Nurse.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the observation to update.
 * @param {object} observationData - The data to update.
 * @returns {Promise<object>} The updated observation object.
 */
export const updateObservation = async (patientUserId, recordId, observationData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Doctor/Nurse access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/observations/${recordId}/`, {
      method: 'PUT', // Or PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(observationData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update observation ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific observation.
 * Accessible by Doctor, Nurse, Admin.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the observation to delete.
 * @returns {Promise<void>}
 */
export const deleteObservation = async (patientUserId, recordId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Doctor/Nurse/Admin access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/observations/${recordId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to delete observation ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};
