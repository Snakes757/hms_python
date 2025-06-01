// src/api/treatments.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';

/**
 * Lists all treatments for a specific patient.
 * Accessible by Patient (own), Doctor, Nurse, Admin.
 * @param {number} patientUserId - The user ID of the patient.
 * @returns {Promise<Array<object>>} A list of treatment objects.
 */
export const listTreatmentsForPatient = async (patientUserId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/treatments/`, {
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
    console.error(`Failed to list treatments for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Creates a new treatment for a patient.
 * Accessible by Doctor, Nurse.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {object} treatmentData - Data for the new treatment.
 * Fields: treatment_name, treatment_date_time, description, outcome, notes.
 * Optional: appointment (ID), medical_record (ID).
 * `administered_by` is set by the backend.
 * @returns {Promise<object>} The created treatment object.
 */
export const createTreatment = async (patientUserId, treatmentData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Doctor/Nurse access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/treatments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(treatmentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to create treatment for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Retrieves details of a specific treatment.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the treatment.
 * @returns {Promise<object>} The treatment object.
 */
export const getTreatmentDetail = async (patientUserId, recordId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/treatments/${recordId}/`, {
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
    console.error(`Failed to retrieve treatment ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific treatment.
 * Accessible by Doctor, Nurse (for records they are involved with or for their patients), Admin (for deletion).
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the treatment to update.
 * @param {object} treatmentData - The data to update.
 * @returns {Promise<object>} The updated treatment object.
 */
export const updateTreatment = async (patientUserId, recordId, treatmentData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Doctor/Nurse access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/treatments/${recordId}/`, {
      method: 'PUT', // Or PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(treatmentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update treatment ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific treatment.
 * Accessible by Doctor, Nurse, Admin.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the treatment to delete.
 * @returns {Promise<void>}
 */
export const deleteTreatment = async (patientUserId, recordId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Doctor/Nurse/Admin access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/treatments/${recordId}/`, {
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
    console.error(`Failed to delete treatment ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};
