// src/components/common/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner'; // Assuming you'll create this

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    // Show a loading spinner while auth state is being determined
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!token || !user) {
    // User not logged in, redirect to login page
    // Pass the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // User does not have the required role, redirect to an unauthorized page or home
    // For simplicity, redirecting to home. You might want an /unauthorized page.
    console.warn(`User with role ${user.role} tried to access a route requiring ${requiredRole}`);
    return <Navigate to="/" state={{ from: location }} replace />; 
  }

  return children; // User is authenticated and has the required role (if specified)
};

// Simple LoadingSpinner component (can be moved to its own file)
// src/components/common/LoadingSpinner.jsx
// const LoadingSpinner = () => (
//   <div className="spinner-border text-primary" role="status">
//     <span className="visually-hidden">Loading...</span>
//   </div>
// );


export default ProtectedRoute;
