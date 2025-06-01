// src/utils/auth.js
// Client-side authentication helper functions.
// This is distinct from src/api/auth.js which handles API calls.

/**
 * Retrieves the authentication token from localStorage.
 * @returns {string|null} The auth token or null if not found.
 */
export const getToken = () => {
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.error("Error accessing token from localStorage:", error);
    return null;
  }
};

/**
 * Retrieves user data from localStorage.
 * @returns {object|null} The user data object or null if not found/error.
 */
export const getUserData = () => {
  try {
    const userDataString = localStorage.getItem('userData');
    return userDataString ? JSON.parse(userDataString) : null;
  } catch (error) {
    console.error("Error accessing/parsing user data from localStorage:", error);
    return null;
  }
};

/**
 * Checks if a user is currently authenticated based on token presence.
 * For more robust checks, you might want to validate the token against the backend.
 * @returns {boolean} True if a token exists, false otherwise.
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Retrieves the role of the currently authenticated user.
 * @returns {string|null} The user's role or null if not authenticated or role not found.
 */
export const getCurrentUserRole = () => {
  const user = getUserData();
  return user ? user.role : null;
};

/**
 * Stores authentication token and user data in localStorage.
 * @param {string} token - The authentication token.
 * @param {object} userData - The user data object.
 */
export const storeAuthData = (token, userData) => {
  try {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  } catch (error) {
    console.error("Error storing auth data in localStorage:", error);
  }
};

/**
 * Clears authentication token and user data from localStorage.
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  } catch (error) {
    console.error("Error clearing auth data from localStorage:", error);
  }
};

// You can add more sophisticated functions here, e.g.,
// - decodeToken (if using JWTs and you need to inspect claims client-side, though often not recommended for sensitive data)
// - isTokenExpired (if using JWTs with an expiration claim)
// - hasRole(requiredRole) - a more direct check than getCurrentUserRole() then comparing.
