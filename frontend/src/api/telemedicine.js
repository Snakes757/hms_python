const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Helper function to handle API responses, including potential HTML error pages
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      // Try to parse as JSON if the server indicates it's JSON
      errorData = await response.json().catch(() => null); // Catch if JSON parsing fails
    }

    // If JSON parsing failed or it's not JSON, get text
    if (!errorData) {
      const textError = await response.text();
      // Check if the textError is an HTML page (simple check for <!doctype html)
      if (textError && textError.toLowerCase().startsWith("<!doctype html")) {
        errorData = { detail: `Server Error: Received HTML page instead of JSON. Status: ${response.status}` };
      } else {
        errorData = { detail: textError || `HTTP error! Status: ${response.status}` };
      }
    }

    let detailedMessage = `HTTP error! Status: ${response.status}`;
    if (errorData) {
        if (errorData.detail) {
            detailedMessage = errorData.detail;
        } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
            // Fallback for other structured errors
            detailedMessage = Object.entries(errorData)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ');
        } else if (typeof errorData === 'string') { // Should be handled by textError above
            detailedMessage = errorData;
        }
    }
    throw new Error(detailedMessage);
  }

  // Handle 204 No Content specifically for GET requests that might return it
  if (response.status === 204) {
    return null; // Or an empty array/object based on what the caller expects for "no content"
  }

  // For other successful responses, try to parse JSON
  // If response body is empty for a 200 OK, .json() might fail or return null/undefined
  const text = await response.text();
  if (!text) {
    return null; // Or appropriate empty state
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Response text:", text);
    throw new Error("Invalid JSON response from server.");
  }
};

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
    const data = await handleResponse(response);

    // If data is null (e.g., 204 No Content), return an empty array as it's a list endpoint.
    if (data === null) {
        return [];
    }
    // If data has a 'results' property (typical for paginated DRF responses), return that.
    // Otherwise, assume data itself is the array of sessions.
    return data.results || (Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Failed to list telemedicine sessions:', error.message);
    // Don't re-throw generic "Error:". The specific message from handleResponse is better.
    throw error;
  }
};

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
    return await handleResponse(response);
  } catch (error) {
    console.error('Failed to create telemedicine session:', error.message);
    throw error;
  }
};

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
    return await handleResponse(response);
  } catch (error) {
    console.error(`Failed to retrieve telemedicine session ${sessionId}:`, error.message);
    throw error;
  }
};

export const updateTelemedicineSession = async (sessionId, sessionData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/telemedicine/${sessionId}/`, {
      method: 'PATCH', // Using PATCH for partial updates
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(sessionData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Failed to update telemedicine session ${sessionId}:`, error.message);
    throw error;
  }
};

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
    // DELETE might return 204 No Content, which handleResponse handles by returning null
    return await handleResponse(response);
  } catch (error) {
    console.error(`Failed to delete/cancel telemedicine session ${sessionId}:`, error.message);
    throw error;
  }
};
