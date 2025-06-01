// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Ensure this path is correct

/**
 * Custom hook to access authentication context.
 * Provides an easy way to get user, token, login, logout, and loading state.
 * Throws an error if used outside of an AuthProvider.
 * @returns {object} The authentication context values.
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    // This error is common if the hook is used in a component
    // not wrapped by AuthProvider.
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
