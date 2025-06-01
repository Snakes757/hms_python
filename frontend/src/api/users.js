// src/api/users.js
// API functions for user management (typically admin actions)

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';

/**
 * Lists all users in the system. (Admin only)
 * @returns {Promise<Array<object>>} A list of user objects.
 */
export const listAllUsers = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Admin access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/`, {
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
    return await response.json(); // Expecting pagination, so response.results
  } catch (error) {
    console.error('Failed to list users:', error);
    throw error;
  }
};

/**
 * Retrieves a specific user by their ID. (Admin only)
 * @param {number} userId - The ID of the user to retrieve.
 * @returns {Promise<object>} The user object.
 */
export const getUserById = async (userId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Admin access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
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
    console.error(`Failed to retrieve user ${userId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific user by their ID. (Admin only)
 * @param {number} userId - The ID of the user to update.
 * @param {object} userData - The data to update for the user.
 * @returns {Promise<object>} The updated user object.
 */
export const updateUserById = async (userId, userData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Admin access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: 'PUT', // or PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update user ${userId}:`, error);
    throw error;
  }
};

/**
 * Deletes a specific user by their ID. (Admin only)
 * @param {number} userId - The ID of the user to delete.
 * @returns {Promise<void>}
 */
export const deleteUserById = async (userId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Admin access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
        if (response.status === 204) return; // No content is a success for DELETE
        const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    // DELETE typically returns 204 No Content, so no JSON body to parse.
  } catch (error) {
    console.error(`Failed to delete user ${userId}:`, error);
    throw error;
  }
};
