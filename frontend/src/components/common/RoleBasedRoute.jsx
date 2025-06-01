import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner"; // Assuming this component exists

/**
 * @file RoleBasedRoute.jsx
 * @description A component to protect routes based on an array of allowed user roles.
 * If the user is not authenticated, they are redirected to the login page.
 * If the user is authenticated but their role is not in the allowedRoles array,
 * they are redirected to an unauthorized page or the home page.
 */

/**
 * RoleBasedRoute component.
 * @param {object} props - The component's props.
 * @param {React.ReactNode} props.children - The child components to render if access is allowed.
 * @param {string[]} props.allowedRoles - An array of roles allowed to access the route.
 * @returns {React.ReactElement} The protected route content or a redirect.
 */
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    // Display a loading spinner while authentication status is being determined
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner message="Authenticating..." />
      </div>
    );
  }

  if (!token || !user) {
    // User is not authenticated, redirect to login page
    // Pass the current location to redirect back after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    // If no roles are specified, or an empty array is passed,
    // consider it a misconfiguration and deny access by default for security.
    console.warn(
      "RoleBasedRoute used without specifying allowedRoles. Access denied by default."
    );
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  const userHasRequiredRole = allowedRoles.includes(user.role);

  if (!userHasRequiredRole) {
    // User is authenticated but does not have one of the allowed roles
    console.warn(
      `User with role ${
        user.role
      } tried to access a route requiring one of ${allowedRoles.join(", ")}.`
    );
    // Redirect to an unauthorized page or a generic page like home
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // User is authenticated and has an allowed role, render the children
  return children;
};

export default RoleBasedRoute;
