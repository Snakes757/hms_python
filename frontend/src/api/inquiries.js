// src/api/inquiries.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';

/**
 * Lists inquiries. Filters based on user role are handled by the backend.
 * Patient: Sees their own submitted inquiries.
 * Staff (Receptionist, Nurse, Admin): Can see more broadly.
 * @param {object} params - Optional query parameters for filtering (e.g., status, source, patient_id, handled_by_id).
 * @returns {Promise<Array<object>>} A list of inquiry objects.
 */
export const listInquiries = async (params = {}) => {
  const token = localStorage.getItem('authToken');
  // Public users can also submit inquiries, but listing usually requires auth.
  // If public listing is allowed for certain statuses, token check might be conditional.
  // For now, assume listing requires auth.

  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/inquiries/${queryParams ? `?${queryParams}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && {'Authorization': `Token ${token}`}), // Conditionally add Auth header
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results || data; // Handle paginated or non-paginated response
  } catch (error) {
    console.error('Failed to list inquiries:', error);
    throw error;
  }
};

/**
 * Submits a new inquiry.
 * Accessible by Public/Unauthenticated, Patient, Receptionist, Nurse, Admin.
 * @param {object} inquiryData - Data for the new inquiry.
 * Required: subject, description.
 * Optional: inquirer_name, inquirer_email, inquirer_phone, patient (ID), source.
 * `status` defaults to OPEN. `handled_by` is for staff updates.
 * @returns {Promise<object>} The created inquiry object.
 */
export const submitInquiry = async (inquiryData) => {
  const token = localStorage.getItem('authToken'); // Token is optional for public submission

  try {
    const response = await fetch(`${API_BASE_URL}/inquiries/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && {'Authorization': `Token ${token}`}), // Add token if available
      },
      body: JSON.stringify(inquiryData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to submit inquiry:', error);
    throw error;
  }
};

/**
 * Retrieves details of a specific inquiry.
 * Accessible by Patient (own), Receptionist, Nurse, Admin.
 * @param {number} inquiryId - The ID of the inquiry.
 * @returns {Promise<object>} The inquiry object.
 */
export const getInquiryDetails = async (inquiryId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    // While public might submit, viewing details likely needs auth or specific token for guest view
    return Promise.reject(new Error("Authentication token required to view inquiry details."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/inquiries/${inquiryId}/`, {
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
    console.error(`Failed to retrieve inquiry ${inquiryId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific inquiry.
 * Accessible by Receptionist, Nurse, Admin. Patient cannot update status/resolution.
 * @param {number} inquiryId - The ID of the inquiry to update.
 * @param {object} inquiryData - The data to update (e.g., status, handled_by, resolution_notes).
 * @returns {Promise<object>} The updated inquiry object.
 */
export const updateInquiry = async (inquiryId, inquiryData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/inquiries/${inquiryId}/`, {
      method: 'PATCH', // Or PUT
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(inquiryData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update inquiry ${inquiryId}:`, error);
    throw error;
  }
};

/**
 * Deletes (closes/hard deletes) a specific inquiry.
 * Admin: Hard delete.
 * Receptionist, Nurse: Marks status as CLOSED.
 * @param {number} inquiryId - The ID of the inquiry.
 * @returns {Promise<object|void>} Response data (e.g., updated inquiry if closed) or nothing if hard deleted.
 */
export const deleteInquiry = async (inquiryId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/inquiries/${inquiryId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      if (response.status === 204) return; // Successful hard delete
      // If not 204, it might be a soft delete (close) returning the updated object or an error
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 200) { // Successful close, backend returns updated inquiry
        return await response.json();
    }
    return; // For 204 No Content
  } catch (error) {
    console.error(`Failed to delete/close inquiry ${inquiryId}:`, error);
    throw error;
  }
};
