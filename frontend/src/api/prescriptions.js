// src/api/prescriptions.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';

/**
 * Lists all prescriptions for a specific patient.
 * Accessible by Patient (own), Doctor, Nurse, Admin.
 * @param {number} patientUserId - The user ID of the patient.
 * @returns {Promise<Array<object>>} A list of prescription objects.
 */
export const listPrescriptionsForPatient = async (patientUserId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/prescriptions/`, {
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
    console.error(`Failed to list prescriptions for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Creates a new prescription for a patient.
 * Accessible by Doctor.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {object} prescriptionData - Data for the new prescription.
 * Fields: medication_name, dosage, frequency, duration_days, instructions, prescription_date, is_active.
 * Optional: appointment (ID), medical_record (ID).
 * `prescribed_by` is set by the backend.
 * @returns {Promise<object>} The created prescription object.
 */
export const createPrescription = async (patientUserId, prescriptionData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Doctor access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/prescriptions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(prescriptionData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to create prescription for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Retrieves details of a specific prescription.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the prescription.
 * @returns {Promise<object>} The prescription object.
 */
export const getPrescriptionDetail = async (patientUserId, recordId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/prescriptions/${recordId}/`, {
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
    console.error(`Failed to retrieve prescription ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific prescription.
 * Accessible by Doctor (for their patients/prescriptions), Admin (for deletion).
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the prescription to update.
 * @param {object} prescriptionData - The data to update.
 * @returns {Promise<object>} The updated prescription object.
 */
export const updatePrescription = async (patientUserId, recordId, prescriptionData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Doctor access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/prescriptions/${recordId}/`, {
      method: 'PUT', // Or PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(prescriptionData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update prescription ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific prescription.
 * Accessible by Doctor (for their patients/prescriptions), Admin.
 * @param {number} patientUserId - The user ID of the patient.
 * @param {number} recordId - The ID of the prescription to delete.
 * @returns {Promise<void>}
 */
export const deletePrescription = async (patientUserId, recordId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Doctor/Admin access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/medical/patient/${patientUserId}/prescriptions/${recordId}/`, {
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
    console.error(`Failed to delete prescription ${recordId} for patient user ID ${patientUserId}:`, error);
    throw error;
  }
};
