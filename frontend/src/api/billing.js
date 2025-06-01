// src/api/billing.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Lists invoices. Filters based on user role are typically handled by the backend.
 * Patient: Sees their own invoices.
 * Receptionist, Admin: Can see all invoices.
 * Doctor/Nurse: May have read-only access to related invoices.
 * @param {object} params - Optional query parameters for filtering (e.g., patient_id, status, date_from, date_to).
 * @returns {Promise<Array<object>>} A list of invoice objects.
 */
export const listInvoices = async (params = {}) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  const queryParams = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/billing/invoices/${queryParams ? `?${queryParams}` : ''}`;

  try {
    const response = await fetch(url, {
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
    const data = await response.json();
    return data.results || data; // Handle paginated or non-paginated response
  } catch (error) {
    console.error('Failed to list invoices:', error);
    throw error;
  }
};

/**
 * Creates a new invoice.
 * Accessible by Receptionist, Admin.
 * @param {object} invoiceData - Data for the new invoice.
 * Required fields: patient (ID), issue_date, due_date, items (array of item objects).
 * `items` objects: { description, quantity, unit_price, appointment (optional ID), treatment (optional ID), prescription (optional ID) }
 * `status` defaults to DRAFT. `created_by` is set by backend.
 * @returns {Promise<object>} The created invoice object.
 */
export const createInvoice = async (invoiceData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/billing/invoices/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create invoice:', error);
    throw error;
  }
};

/**
 * Retrieves details of a specific invoice.
 * @param {number} invoiceId - The ID of the invoice.
 * @returns {Promise<object>} The invoice object.
 */
export const getInvoiceDetails = async (invoiceId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/`, {
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
    console.error(`Failed to retrieve invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific invoice.
 * Accessible by Receptionist, Admin.
 * @param {number} invoiceId - The ID of the invoice to update.
 * @param {object} invoiceData - The data to update (e.g., status, items on draft).
 * @returns {Promise<object>} The updated invoice object.
 */
export const updateInvoice = async (invoiceId, invoiceData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/`, {
      method: 'PUT', // Or PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to update invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Deletes (voids) a specific invoice.
 * Accessible by Receptionist (void if allowed), Admin (void).
 * @param {number} invoiceId - The ID of the invoice.
 * @returns {Promise<object|void>} Response data (e.g., voided invoice) or nothing.
 */
export const deleteInvoice = async (invoiceId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
        // DELETE on invoice might return 200 OK with the voided invoice data or 204 for hard delete by admin (if implemented)
        // The backend view for InvoiceDetailAPIView perform_destroy returns 200 OK with voided data
        if (response.status === 204) return; // Successful hard delete
        const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 200) { // Successful void, backend returns updated invoice
        return await response.json();
    }
    return; // For 204 No Content
  } catch (error) {
    console.error(`Failed to void/delete invoice ${invoiceId}:`, error);
    throw error;
  }
};

// --- Payment Endpoints ---

/**
 * Lists payments for a specific invoice.
 * Accessible by Patient (own), Receptionist, Admin.
 * @param {number} invoiceId - The ID of the invoice.
 * @returns {Promise<Array<object>>} A list of payment objects.
 */
export const listPaymentsForInvoice = async (invoiceId) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/payments/`, {
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
    const data = await response.json();
    return data.results || data;
  } catch (error) {
    console.error(`Failed to list payments for invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Records a new payment for an invoice.
 * Accessible by Receptionist, Admin.
 * @param {number} invoiceId - The ID of the invoice.
 * @param {object} paymentData - Data for the new payment.
 * Fields: amount, payment_method, payment_date. Optional: transaction_id, notes.
 * `recorded_by` is set by backend.
 * @returns {Promise<object>} The created payment object.
 */
export const recordPayment = async (invoiceId, paymentData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found. Staff access required."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/payments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to record payment for invoice ${invoiceId}:`, error);
    throw error;
  }
};

// Get, Update, Delete for specific payment can be added if needed:
// GET /invoices/<invoice_id>/payments/<payment_id>/
// PUT, PATCH /invoices/<invoice_id>/payments/<payment_id>/
// DELETE /invoices/<invoice_id>/payments/<payment_id>/
