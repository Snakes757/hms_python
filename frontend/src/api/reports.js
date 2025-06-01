// src/api/reports.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Fetches a list of available reports. (Admin only)
 * Corresponds to GET /api/v1/dashboard/reports/
 * @returns {Promise<Array<object>>} A list of available report objects with name, endpoint, description.
 */
export const listAvailableReports = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Admin access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/reports/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to list available reports:', error);
    throw error;
  }
};

/**
 * Fetches patient statistics report data. (Admin only)
 * Corresponds to GET /api/v1/dashboard/reports/patient-statistics/
 * @param {string} format - Optional format ('csv').
 * @returns {Promise<object|string>} Report data object or CSV string.
 */
export const getPatientStatisticsReport = async (format = 'json') => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Admin access required."));
  }
  
  const url = `${API_BASE_URL}/dashboard/reports/patient-statistics/${format === 'csv' ? '?format=csv' : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // 'Content-Type' for GET is usually not needed unless sending a body (which we are not)
        // For CSV, the server will set Content-Type of the response.
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` })); // Fallback if response is not JSON
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    if (format === 'csv') {
        return await response.text(); // Return CSV as text
    }
    return await response.json(); // Return JSON object
  } catch (error) {
    console.error('Failed to fetch patient statistics report:', error);
    throw error;
  }
};

/**
 * Fetches appointment report data. (Admin only)
 * Corresponds to GET /api/v1/dashboard/reports/appointment-report/
 * @param {object} params - Optional parameters { date_from, date_to, format ('csv') }.
 * @returns {Promise<object|string>} Report data object or CSV string.
 */
export const getAppointmentReport = async (params = {}) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Admin access required."));
  }

  const queryParams = new URLSearchParams();
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.format === 'csv') queryParams.append('format', 'csv');
  
  const url = `${API_BASE_URL}/dashboard/reports/appointment-report/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    if (params.format === 'csv') {
        return await response.text();
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch appointment report:', error);
    throw error;
  }
};

/**
 * Fetches financial report data. (Admin only)
 * Corresponds to GET /api/v1/dashboard/reports/financial-report/
 * @param {object} params - Optional parameters { date_from, date_to, format ('csv') }.
 * @returns {Promise<object|string>} Report data object or CSV string.
 */
export const getFinancialReport = async (params = {}) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Admin access required."));
  }

  const queryParams = new URLSearchParams();
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.format === 'csv') queryParams.append('format', 'csv');

  const url = `${API_BASE_URL}/dashboard/reports/financial-report/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
     if (params.format === 'csv') {
        return await response.text();
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch financial report:', error);
    throw error;
  }
};

/**
 * Fetches staff activity report data. (Admin only)
 * Corresponds to GET /api/v1/dashboard/reports/staff-activity-report/
 * @returns {Promise<object>} Report data object.
 */
export const getStaffActivityReport = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Admin access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/reports/staff-activity-report/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch staff activity report:', error);
    throw error;
  }
};
