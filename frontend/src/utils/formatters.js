// src/utils/formatters.js

/**
 * Formats a date string or Date object into a more readable format.
 * @param {string|Date} dateInput - The date to format.
 * @param {object} options - Intl.DateTimeFormat options.
 * @returns {string} Formatted date string, or 'N/A' if input is invalid.
 */
export const formatDate = (dateInput, options = { year: 'numeric', month: 'long', day: 'numeric' }) => {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'N/A';
  }
};

/**
 * Formats a date-time string or Date object into a more readable format.
 * @param {string|Date} dateTimeInput - The date-time to format.
 * @param {object} options - Intl.DateTimeFormat options.
 * @returns {string} Formatted date-time string, or 'N/A' if input is invalid.
 */
export const formatDateTime = (dateTimeInput, options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) => {
  if (!dateTimeInput) return 'N/A';
  try {
    const date = new Date(dateTimeInput);
    if (isNaN(date.getTime())) return 'Invalid Date/Time';
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error("Error formatting date-time:", error);
    return 'N/A';
  }
};

/**
 * Formats a number as currency.
 * @param {number|string} amount - The amount to format.
 * @param {string} currencyCode - The currency code (e.g., 'USD', 'EUR', 'ZAR'). Default 'USD'.
 * @param {string} locale - The locale for formatting (e.g., 'en-US', 'en-ZA'). Default 'en-US'.
 * @returns {string} Formatted currency string, or 'N/A' if input is invalid.
 */
export const formatCurrency = (amount, currencyCode = 'USD', locale = 'en-US') => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return 'N/A';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(numAmount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    // Fallback for unsupported currency codes in some environments
    return `${currencyCode} ${numAmount.toFixed(2)}`;
  }
};

/**
 * Capitalizes the first letter of each word in a string.
 * Handles null or undefined input gracefully.
 * @param {string} str - The string to capitalize.
 * @returns {string} The capitalized string or an empty string if input is invalid.
 */
export const capitalizeWords = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Truncates a string to a specified length and appends an ellipsis if truncated.
 * @param {string} str - The string to truncate.
 * @param {number} maxLength - The maximum length of the string.
 * @returns {string} The truncated string.
 */
export const truncateText = (str, maxLength = 100) => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

/**
 * Converts a role string (e.g., 'DOCTOR') to a display-friendly format (e.g., 'Doctor').
 * @param {string} role - The role string.
 * @returns {string} The display-friendly role name.
 */
export const formatRoleForDisplay = (role) => {
  if (!role || typeof role !== 'string') return 'Unknown Role';
  return capitalizeWords(role.replace('_', ' '));
};
