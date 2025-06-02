// src/api/patients.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Helper function for consistent response handling (can be moved to a shared util if used widely)
const handleApiResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      errorData = await response.json().catch(() => ({ detail: `HTTP error! Status: ${response.status}. Failed to parse JSON error.` }));
    } else {
      const textError = await response.text();
      // Check if the textError is an HTML page (simple check for <!doctype html)
      if (textError && textError.toLowerCase().includes("<!doctype html")) {
          errorData = { detail: `Server Error: Received HTML page instead of JSON. Status: ${response.status}` };
      } else {
          errorData = { detail: textError || `HTTP error! Status: ${response.status}. Non-JSON response.` };
      }
    }
    
    let detailedMessage = errorData.detail || `HTTP error! Status: ${response.status}`;
    // Fallback for other structured errors if detail is not present
    if (typeof errorData === 'object' && Object.keys(errorData).length > 0 && !errorData.detail) {
        detailedMessage = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
        if (!detailedMessage) detailedMessage = `HTTP error! Status: ${response.status}. Unknown error structure.`;
    }
    throw new Error(detailedMessage);
  }

  // Handle 204 No Content specifically
  if (response.status === 204) {
    return null; 
  }

  const text = await response.text();
  if (!text) {
    return null; // Or an appropriate empty state depending on what the caller expects
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Response text:", text);
    throw new Error("Invalid JSON response from server.");
  }
};


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
    const data = await handleApiResponse(response); // Use robust handler
    return data ? (data.results || data) : []; // Ensure array return for list
  } catch (error) {
    console.error('Failed to list patients:', error.message);
    throw error;
  }
};

export const getPatientByUserId = async (userId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("Authentication token not found. Please log in."));
  }
  if (!userId || userId === 'undefined') { // Explicitly check for "undefined" string if it might come from URL params
    return Promise.reject(new Error("Invalid or missing Patient User ID provided for fetching profile."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/${userId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });
    return await handleApiResponse(response); // Use robust handler
  } catch (error) {
    console.error(`Failed to retrieve patient profile for user ID ${userId}:`, error.message);
    throw error;
  }
};

export const updatePatientByUserId = async (userId, patientData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }
   if (!userId || userId === 'undefined') {
    return Promise.reject(new Error("Invalid or missing Patient User ID provided for update."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patients/${userId}/`, {
      method: 'PATCH', // Using PATCH for partial updates is common
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(patientData),
    });
    return await handleApiResponse(response); // Use robust handler
  } catch (error) {
    console.error(`Failed to update patient profile for user ID ${userId}:`, error.message);
    throw error;
  }
};
