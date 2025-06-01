// src/hooks/useApi.js
import { useState, useCallback, useContext } from 'react';
import apiClient from '../utils/api'; // Assuming apiClient is your configured fetch wrapper
import { AuthContext } from '../context/AuthContext'; // To potentially handle auth errors globally

/**
 * Custom hook for making API calls.
 * Manages loading, error, and data states.
 * @param {function} apiCallFunction - The function that makes the API request (e.g., an async function using apiClient).
 * @returns {object} { data, error, isLoading, makeRequest }
 */
const useApi = (apiCallFunction) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useContext(AuthContext); // Get logout to handle 401/403 errors

  /**
   * Executes the API call.
   * @param  {...any} args - Arguments to pass to the apiCallFunction.
   */
  const makeRequest = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await apiCallFunction(...args);
      setData(result);
      return result; // Return result for promise chaining if needed
    } catch (err) {
      setError(err.message || 'An API error occurred.');
      console.error("useApi error:", err);
      // Example: Global handling for authentication errors
      if (err.message.includes('401') || err.message.includes('403') || err.message.toLowerCase().includes('authentication credentials were not provided')) {
        // Consider more specific error codes or messages from your backend
        // If it's an auth error, and not for login/register, potentially log out user
        // This is a basic example; refine based on your app's needs.
        // if (!apiCallFunction.name.toLowerCase().includes('login') && !apiCallFunction.name.toLowerCase().includes('register')) {
        //   logout(); 
        //   // navigate('/login', { state: { message: 'Session expired. Please log in again.' }});
        // }
      }
      throw err; // Re-throw to allow specific error handling in component
    } finally {
      setIsLoading(false);
    }
  }, [apiCallFunction, logout]); // Added logout to dependency array

  return { data, error, isLoading, makeRequest, setError, setData };
};

export default useApi;

// Example Usage in a component:
// import useApi from '../hooks/useApi';
// import { getUserProfile } from '../api/auth';
//
// const ProfileComponent = () => {
//   const { data: userProfile, error, isLoading, makeRequest: fetchProfile } = useApi(getUserProfile);
//
//   useEffect(() => {
//     fetchProfile();
//   }, [fetchProfile]);
//
//   if (isLoading) return <p>Loading profile...</p>;
//   if (error) return <p>Error loading profile: {error}</p>;
//   if (!userProfile) return <p>No profile data.</p>;
//
//   return <div>Hello, {userProfile.first_name}</div>;
// };
