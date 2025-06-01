// src/hooks/usePermissions.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
// Corrected: Import USER_ROLES directly from constants.js
import { USER_ROLES } from '../utils/constants';
import { hasPermission as checkPermission } from '../utils/rolePermissions'; // Keep this for hasPermission

const usePermissions = () => {
  const { user } = useContext(AuthContext);

  const can = (permission) => {
    if (!user || !user.role) {
      return false;
    }
    return checkPermission(user.role, permission);
  };

  const currentUserRole = user?.role || null;

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
