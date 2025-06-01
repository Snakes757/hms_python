// src/utils/validators.js

/**
 * Validates if a value is not empty (after trimming whitespace).
 * @param {string} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 * @returns {string|null} Error message string if invalid, otherwise null.
 */
export const validateNotEmpty = (value, fieldName = 'Field') => {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return `${fieldName} is required.`;
  }
  return null;
};

/**
 * Validates an email address format.
 * @param {string} email - The email address to validate.
 * @returns {string|null} Error message string if invalid, otherwise null.
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return 'Email is required.';
  }
  // Basic email regex (not exhaustive but covers common cases)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Invalid email address format.';
  }
  return null;
};

/**
 * Validates password length.
 * @param {string} password - The password to validate.
 * @param {number} minLength - The minimum required length.
 * @returns {string|null} Error message string if invalid, otherwise null.
 */
export const validatePasswordLength = (password, minLength = 10) => {
  if (!password || password.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }
  return null;
};

/**
 * Validates if two passwords match.
 * @param {string} password - The first password.
 * @param {string} confirmPassword - The second (confirmation) password.
 * @returns {string|null} Error message string if they don't match, otherwise null.
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
};

/**
 * Validates if a value is a positive number.
 * @param {string|number} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 * @returns {string|null} Error message string if invalid, otherwise null.
 */
export const validatePositiveNumber = (value, fieldName = 'Value') => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) {
    return `${fieldName} must be a positive number.`;
  }
  return null;
};

/**
 * Validates if a value is a non-negative number (zero or positive).
 * @param {string|number} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 * @returns {string|null} Error message string if invalid, otherwise null.
 */
export const validateNonNegativeNumber = (value, fieldName = 'Value') => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return `${fieldName} must be a non-negative number.`;
    }
    return null;
  };


/**
 * Validates a date string is not in the past.
 * @param {string} dateString - The date string (e.g., "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm").
 * @param {string} fieldName - The name of the field for error messages.
 * @param {boolean} ignoreTime - If true, compares only the date part.
 * @returns {string|null} Error message string if invalid, otherwise null.
 */
export const validateFutureDate = (dateString, fieldName = 'Date', ignoreTime = false) => {
    if (!dateString) return `${fieldName} is required.`;
    
    const inputDate = new Date(dateString);
    let now = new Date();

    if (ignoreTime) {
        inputDate.setHours(0,0,0,0);
        now.setHours(0,0,0,0);
    }
    
    if (inputDate < now) {
        return `${fieldName} cannot be in the past.`;
    }
    return null;
};

/**
 * Validates a phone number (basic check for digits and optional symbols).
 * @param {string} phoneNumber - The phone number to validate.
 * @returns {string|null} Error message string if invalid, otherwise null.
 */
export const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
        // return 'Phone number is required.'; // Make it optional by returning null
        return null; 
    }
    // Allows digits, spaces, parentheses, hyphens, plus sign
    const phoneRegex = /^[+]?[\d\s()-]+$/; 
    if (!phoneRegex.test(phoneNumber.trim())) {
        return 'Invalid phone number format. Use digits and standard symbols like +, -, (, ).';
    }
    if (phoneNumber.replace(/\D/g, '').length < 7) { // Check for minimum number of digits
        return 'Phone number seems too short.';
    }
    return null;
};
