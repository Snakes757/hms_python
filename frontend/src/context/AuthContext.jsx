// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { getUserProfile } from '../api/auth'; // To fetch user profile on app load if token exists

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true); // To handle initial auth state check

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('userData');

      if (storedToken) {
        setToken(storedToken); // Set token from localStorage
        if (storedUserData) {
          try {
            setUser(JSON.parse(storedUserData));
          } catch (e) {
            console.error("Failed to parse stored user data", e);
            localStorage.removeItem('userData'); // Clear corrupted data
            localStorage.removeItem('authToken'); // Also clear token if user data is bad
            setToken(null);
          }
        } else {
          // If no user data, but token exists, try to fetch profile
          // This is a fallback, ideally userData is stored on login
          try {
            const profile = await getUserProfile(); // getUserProfile uses token from localStorage
            setUser(profile);
            localStorage.setItem('userData', JSON.stringify(profile));
          } catch (error) {
            console.error("Failed to fetch profile with stored token:", error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setToken(null); // Clear token if profile fetch fails
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []); // Empty dependency array means this runs once on mount

  // Function to update user and token, e.g., after login
  const login = (userData, authToken) => {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userData', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  // Function to clear user and token, e.g., after logout
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, login, logout, loading }}>
      {!loading && children} {/* Don't render children until initial auth check is done */}
    </AuthContext.Provider>
  );
};
