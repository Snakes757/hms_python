// src/api/patients.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Lists all patients.
 * Accessible by Doctor, Nurse, Admin, Receptionist.
 * @returns {Promise<Array<object>>} A list of patient objects.
 */
export const listAllPatients = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/`, {
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
    console.error('Failed to list patients:', error);
    throw error;
  }
};

/**
 * Retrieves a specific patient's profile by their user ID.
 * Accessible by Patient (own), Doctor, Nurse, Admin, Receptionist.
 * @param {number} userId - The user ID of the patient.
 * @returns {Promise<object>} The patient's profile data.
 */
export const getPatientByUserId = async (userId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/${userId}/`, {
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
    console.error(`Failed to retrieve patient profile for user ID ${userId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific patient's profile by their user ID.
 * Typically for Admin, Doctor (limited), Receptionist (limited).
 * @param {number} userId - The user ID of the patient.
 * @param {object} patientData - The data to update.
 * @returns {Promise<object>} The updated patient profile data.
 */
export const updatePatientByUserId = async (userId, patientData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/${userId}/`, {
      method: 'PATCH', // PATCH is generally preferred for updates
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update patient profile for user ID ${userId}:`, error);
    throw error;
  }
};

// Note: Patient creation is typically handled via User Registration (/api/v1/users/register/)
// where if role=PATIENT, a Patient profile is automatically created by a backend signal.
// Direct creation via /api/v1/patients/ might not be standard flow unless it's for admins
// linking an existing user (without patient role) to a new patient profile, which is less common.
