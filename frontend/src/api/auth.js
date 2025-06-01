// src/api/auth.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1'; // Ensure this is configured in your .env

/**
 * Registers a new user.
 * @param {object} userData - The user data for registration.
 * Expected fields: username, email, password, password_confirm, first_name, last_name, role.
 * Role-specific fields like specialization (for Doctor), department (for Nurse) might be needed.
 * @returns {Promise<object>} The response data from the API.
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

/**
 * Logs in a user.
 * @param {object} credentials - The user's login credentials.
 * Expected fields: email, password.
 * @returns {Promise<object>} The response data from the API, including user details and token.
 */
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Store the token (e.g., in localStorage or context)
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user)); // Store user data
    }
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

/**
 * Logs out the currently authenticated user.
 * Requires the auth token to be sent in the headers.
 * @returns {Promise<object>} The response data from the API.
 */
export const logoutUser = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    // No token, user is not logged in or token is already cleared.
    localStorage.removeItem('userData'); // Clear user data as well
    return Promise.resolve({ message: "Already logged out or no token found." });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });
    // Logout should succeed even if the token is invalid on the server,
    // as the goal is to clear client-side session.
    // However, we check response.ok for server confirmation.
    if (!response.ok) {
        // If server returns an error (e.g. 401 if token was already invalid),
        // still proceed to clear client-side token.
        console.warn(`Logout failed on server: ${response.status}. Proceeding with client-side logout.`);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    return { message: "Logout successful." }; // Assuming backend might not return JSON on successful logout
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear client-side token in case of network error
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    throw error;
  }
};

/**
 * Retrieves the profile of the currently authenticated user.
 * @returns {Promise<object>} The user's profile data.
 */
export const getUserProfile = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/profile/`, { // Backend uses /profile/ for current user
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
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

/**
 * Updates the profile of the currently authenticated user.
 * @param {object} profileData - The data to update.
 * @returns {Promise<object>} The updated user profile data.
 */
export const updateUserProfile = async (profileData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/profile/`, { // Backend uses /profile/ for current user
      method: 'PUT', // Or PATCH if partial updates are allowed and preferred
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
};
