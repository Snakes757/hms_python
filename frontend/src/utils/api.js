// src/utils/api.js
// This file can house generic API utility functions, like a configured fetch wrapper.

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';

/**
 * A generic fetch wrapper that includes authorization token and handles common errors.
 * @param {string} endpoint - The API endpoint (e.g., '/users/profile/').
 * @param {object} options - Fetch options (method, body, headers, etc.).
 * @param {boolean} includeAuth - Whether to include the Authorization token. Default is true.
 * @returns {Promise<any>} The JSON response from the API.
 */
export const apiClient = async (endpoint, options = {}, includeAuth = true) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (includeAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    } else if (options.method && options.method.toUpperCase() !== 'GET' && !url.includes('/users/register/') && !url.includes('/users/login/')) {
      // For non-GET requests that are not login/register, if no token, it's likely an issue.
      // However, some public POSTs like inquiries might exist.
      // This logic can be refined based on specific public POST endpoints.
      console.warn(`API call to ${endpoint} without auth token.`);
    }
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON (e.g., plain text error or HTML for 500)
        const textError = await response.text();
        errorData = { detail: textError || `HTTP error! Status: ${response.status}` };
      }
      // Construct a more detailed error message
      let detailedMessage = `HTTP error! Status: ${response.status}`;
      if (errorData) {
          if (errorData.detail) {
              detailedMessage = errorData.detail;
          } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
              // Handle cases where errorData is an object of field errors
              const messages = Object.entries(errorData).map(([field, msgs]) => {
                  return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
              }).join('; ');
              if (messages) detailedMessage = messages;
          } else if (typeof errorData === 'string') {
              detailedMessage = errorData;
          }
      }
      throw new Error(detailedMessage);
    }

    // Handle 204 No Content for DELETE requests
    if (response.status === 204) {
      return null; 
    }

    return await response.json();
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error.message);
    throw error; // Re-throw to be caught by calling function
  }
};

// Example usage (can be moved to specific api/module.js files):
// import { apiClient } from './utils/api';
// const fetchUserProfile = () => apiClient('/users/profile/');
// const login = (credentials) => apiClient('/users/login/', { method: 'POST', body: credentials }, false);

export default apiClient;
