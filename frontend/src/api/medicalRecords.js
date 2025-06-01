// src/api/medicalRecords.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';

/**
 * Lists all medical records for a specific patient.
 * Accessible by Patient (own), Doctor, Nurse, Admin, Receptionist (read-only for some).
 * @param {number} patientUserId - The user ID of the patient.
 * @returns {Promise<Array<object>>} A list of medical record objects.
 */
export const listMedicalRecordsForPatient = async (patientUserId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientUserId}/medical-records/`, {
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
    console.error(`Failed to list medical records for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Creates a new medical record for a specific patient.
 * Accessible by Doctor, Nurse, Admin.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {object} recordData - The data for the new medical record.
 * Expected fields: diagnosis, symptoms, treatment_plan, notes. record_date is often auto-set.
 * created_by is set by the backend based on the authenticated user.
 * @returns {Promise<object>} The created medical record object.
 */
export const createMedicalRecord = async (patientUserId, recordData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientUserId}/medical-records/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(recordData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to create medical record for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Retrieves a specific medical record for a patient.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the medical record.
 * @returns {Promise<object>} The medical record object.
 */
export const getMedicalRecordDetail = async (patientUserId, recordId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientUserId}/medical-records/${recordId}/`, {
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
    console.error(`Failed to retrieve medical record ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific medical record for a patient.
 * Accessible by Doctor, Nurse, Admin.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the medical record to update.
 * @param {object} recordData - The data to update.
 * @returns {Promise<object>} The updated medical record object.
 */
export const updateMedicalRecord = async (patientUserId, recordId, recordData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientUserId}/medical-records/${recordId}/`, {
      method: 'PUT', // Or PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(recordData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update medical record ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific medical record for a patient.
 * Accessible by Doctor, Nurse, Admin.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the medical record to delete.
 * @returns {Promise<void>}
 */
export const deleteMedicalRecord = async (patientUserId, recordId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientUserId}/medical-records/${recordId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok && response.status !== 204) { // 204 No Content is success for DELETE
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    // No content to return on successful delete
  } catch (error) {
    console.error(`Failed to delete medical record ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};
