// src/utils/rolePermissions.js
import { USER_ROLES } from './constants'; // Assuming USER_ROLES are defined in constants.js

// Define permissions for various actions.
// This is a simplified example. In a real app, this could be more complex,
// potentially fetched from a backend, or involve checking specific permission flags on the user object.

const PERMISSIONS = {
  VIEW_PATIENT_LIST: [USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE, USER_ROLES.RECEPTIONIST],
  MANAGE_PATIENT_PROFILE: [USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST], // Who can edit full profiles
  CREATE_MEDICAL_RECORD: [USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE],
  MANAGE_MEDICAL_RECORD: [USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE], // Edit/Delete
  
  SCHEDULE_APPOINTMENT_FOR_SELF: [USER_ROLES.PATIENT],
  SCHEDULE_APPOINTMENT_FOR_OTHERS: [USER_ROLES.ADMIN, USER_ROLES.DOCTOR, USER_ROLES.NURSE, USER_ROLES.RECEPTIONIST],
  MANAGE_ALL_APPOINTMENTS: [USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST],
  MANAGE_OWN_APPOINTMENTS_DOCTOR: [USER_ROLES.DOCTOR], // e.g., update status for their appointments
  CANCEL_OWN_APPOINTMENT_PATIENT: [USER_ROLES.PATIENT],

  CREATE_PRESCRIPTION: [USER_ROLES.DOCTOR],
  MANAGE_PRESCRIPTION: [USER_ROLES.DOCTOR, USER_ROLES.ADMIN], // Admin might delete erroneous ones

  RECORD_TREATMENT: [USER_ROLES.DOCTOR, USER_ROLES.NURSE],
  MANAGE_TREATMENT: [USER_ROLES.DOCTOR, USER_ROLES.NURSE, USER_ROLES.ADMIN],

  LOG_OBSERVATION: [USER_ROLES.DOCTOR, USER_ROLES.NURSE],
  MANAGE_OBSERVATION: [USER_ROLES.DOCTOR, USER_ROLES.NURSE, USER_ROLES.ADMIN],

  MANAGE_INVOICES: [USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST],
  CREATE_INVOICE: [USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST],
  RECORD_PAYMENT: [USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST],
  VIEW_OWN_INVOICES: [USER_ROLES.PATIENT],

  MANAGE_TELEMEDICINE_SESSIONS: [USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.DOCTOR],
  JOIN_TELEMEDICINE_PATIENT: [USER_ROLES.PATIENT],
  JOIN_TELEMEDICINE_DOCTOR: [USER_ROLES.DOCTOR],

  MANAGE_INQUIRIES_STAFF: [USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.NURSE],
  SUBMIT_INQUIRY: [USER_ROLES.PATIENT, USER_ROLES.ADMIN, USER_ROLES.RECEPTIONIST, USER_ROLES.NURSE, 'PUBLIC'], // 'PUBLIC' for unauthenticated

  VIEW_ADMIN_DASHBOARD: [USER_ROLES.ADMIN],
  VIEW_REPORTS: [USER_ROLES.ADMIN],
  MANAGE_ALL_USERS: [USER_ROLES.ADMIN],
};

/**
 * Checks if a user with a given role has a specific permission.
 * @param {string} userRole - The role of the user (e.g., 'DOCTOR', 'PATIENT').
 * @param {string} permission - The permission to check (e.g., 'VIEW_PATIENT_LIST').
 * @returns {boolean} True if the user has the permission, false otherwise.
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) {
    return false;
  }
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    console.warn(`Permission "${permission}" is not defined.`);
    return false; // Undefined permission defaults to no access
  }
  return allowedRoles.includes(userRole);
};

// Example of checking if the user can perform any of a set of permissions
// export const canPerformAny = (userRole, permissionsArray) => {
//   if (!userRole || !Array.isArray(permissionsArray)) return false;
//   return permissionsArray.some(permission => hasPermission(userRole, permission));
// };

export default PERMISSIONS; // Export the whole object if needed elsewhere, or just hasPermission
