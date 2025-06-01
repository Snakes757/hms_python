// src/api/auth.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';

/**
 * Registers a new user.
 * @param {object} userData - The user data for registration.
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
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
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
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
    }
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

/**
 * Logs out the currently authenticated user.
 * @returns {Promise<object>} The response data from the API.
 */
export const logoutUser = async () => {
  const token = localStorage.getItem('authToken');
  // Always clear client-side storage regardless of server response
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');

  if (!token) {
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
    if (!response.ok) {
      console.warn(`Logout request to server failed: ${response.status}. Client-side logout still performed.`);
      // Depending on backend, it might return error if token is already invalid.
      // We don't throw an error here as client-side logout is the main goal.
    }
    return { message: "Logout successful." };
  } catch (error) {
    console.error('Logout API call failed:', error);
    // Client-side logout already performed.
    // Optionally re-throw if you want to handle network errors specifically.
    return { message: "Logout completed locally, server call failed." };
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
    const response = await fetch(`${API_BASE_URL}/users/profile/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
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
    const response = await fetch(`${API_BASE_URL}/users/profile/`, {
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
    }
    const updatedUser = await response.json();
    localStorage.setItem('userData', JSON.stringify(updatedUser)); // Update stored user data
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
};

/**
 * Sends a password reset request.
 * IMPORTANT: Backend endpoint /api/v1/users/password-reset/ is assumed.
 * @param {string} email - The user's email address.
 * @returns {Promise<object>} Success message from the API.
 */
export const requestPasswordReset = async (email) => {
  // const API_ENDPOINT = `${API_BASE_URL}/users/password-reset/`; // Example endpoint
  // console.warn(`requestPasswordReset: API endpoint for this is not defined in backend docs. Using placeholder for ${API_ENDPOINT}`);
  
  // Placeholder implementation:
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "test@example.com" || email.includes('@')) { // Simulate success for any valid-looking email
        console.log(`Simulating password reset request for ${email}`);
        resolve({ message: "If an account with this email exists, a password reset link has been sent." });
      } else {
        reject(new Error("Invalid email format for password reset simulation."));
      }
    }, 1000);
  });

  /*
  // Actual implementation would look like this:
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Password reset request failed:', error);
    throw error;
  }
  */
};

/**
 * Confirms password reset with a new password and token.
 * IMPORTANT: Backend endpoint /api/v1/users/password-reset/confirm/ is assumed.
 * @param {string} uid - User ID from the reset link.
 * @param {string} token - Token from the reset link.
 * @param {string} new_password1 - The new password.
 * @param {string} new_password2 - Confirmation of the new password.
 * @returns {Promise<object>} Success message from the API.
 */
export const confirmPasswordReset = async (uid, token, new_password1, new_password2) => {
  // const API_ENDPOINT = `${API_BASE_URL}/users/password-reset/confirm/`; // Example endpoint
  // console.warn(`confirmPasswordReset: API endpoint for this is not defined in backend docs. Using placeholder for ${API_ENDPOINT}`);

  // Placeholder implementation:
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (new_password1 === new_password2 && new_password1.length >= 10 && token && uid) {
        console.log(`Simulating password reset confirmation for uid: ${uid}`);
        resolve({ message: "Password has been reset successfully. You can now log in with your new password." });
      } else if (new_password1 !== new_password2) {
        reject(new Error("Passwords do not match."));  
      } else {
        reject(new Error("Password reset confirmation failed (simulated). Ensure token, uid, and valid passwords."));
      }
    }, 1000);
  });
  
  /*
  // Actual implementation:
  try {
    const response = await fetch(API_ENDPOINT, { // This endpoint might need uid and token in URL or body
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid, token, new_password1, new_password2 }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Password reset confirmation failed:', error);
    throw error;
  }
  */
};
