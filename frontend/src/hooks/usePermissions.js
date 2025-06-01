// src/hooks/usePermissions.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { hasPermission as checkPermission, USER_ROLES } from '../utils/rolePermissions'; // Import USER_ROLES as well

/**
 * Custom hook to check user permissions and access user role.
 * @returns {object} An object containing:
 * - `can`: A function to check if the current user has a specific permission.
 * - `currentUserRole`: The role string of the current user (e.g., 'DOCTOR', 'PATIENT').
 * - `isRole`: An object with boolean flags for each role (e.g., isRole.ADMIN, isRole.DOCTOR).
 */
const usePermissions = () => {
  const { user } = useContext(AuthContext);

  /**
   * Checks if the current user has a specific permission.
   * @param {string} permission - The permission string to check (e.g., 'VIEW_PATIENT_LIST').
   * @returns {boolean} True if the user has the permission, false otherwise.
   */
  const can = (permission) => {
    if (!user || !user.role) {
      return false; // No user or role, no permissions
    }
    return checkPermission(user.role, permission);
  };

  const currentUserRole = user?.role || null;

  // Helper flags for common role checks
  const isRole = {
    isAdmin: currentUserRole === USER_ROLES.ADMIN,
    isDoctor: currentUserRole === USER_ROLES.DOCTOR,
    isNurse: currentUserRole === USER_ROLES.NURSE,
    isReceptionist: currentUserRole === USER_ROLES.RECEPTIONIST,
    isPatient: currentUserRole === USER_ROLES.PATIENT,
    isStaff: [USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE, USER_ROLES.RECEPTIONIST].includes(currentUserRole),
  };

  return { can, currentUserRole, isRole };
};

export default usePermissions;

// Example Usage in a component:
// import usePermissions from '../hooks/usePermissions';
//
// const SomeComponent = () => {
//   const { can, currentUserRole, isRole } = usePermissions();
//
//   return (
//     <div>
//       {can('VIEW_ADMIN_DASHBOARD') && <Link to="/admin/dashboard">Admin Dashboard</Link>}
//       {isRole.isDoctor && <p>Welcome, Doctor!</p>}
//       <p>Your role: {currentUserRole}</p>
//     </div>
//   );
// };
