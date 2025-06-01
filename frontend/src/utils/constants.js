// src/utils/constants.js

// User Roles (ensure these match backend definitions in users/models.py UserRole)
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  RECEPTIONIST: 'RECEPTIONIST',
  PATIENT: 'PATIENT',
};

// Appointment Statuses (from appointments/models.py AppointmentStatus)
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED_BY_PATIENT: 'CANCELLED_BY_PATIENT',
  CANCELLED_BY_STAFF: 'CANCELLED_BY_STAFF',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED',
};

// Appointment Types (from appointments/models.py AppointmentType)
export const APPOINTMENT_TYPE = {
  GENERAL_CONSULTATION: 'GENERAL_CONSULTATION',
  SPECIALIST_VISIT: 'SPECIALIST_VISIT',
  FOLLOW_UP: 'FOLLOW_UP',
  TELEMEDICINE: 'TELEMEDICINE',
  PROCEDURE: 'PROCEDURE',
  CHECK_UP: 'CHECK_UP',
  EMERGENCY: 'EMERGENCY',
};

// Invoice Statuses (from billing/models.py InvoiceStatus)
export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  VOID: 'VOID',
  OVERDUE: 'OVERDUE',
};

// Payment Methods (from billing/models.py PaymentMethod)
export const PAYMENT_METHOD = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  INSURANCE: 'INSURANCE',
  MOBILE_MONEY: 'MOBILE_MONEY',
  OTHER: 'OTHER',
};

// Telemedicine Session Statuses (from telemedicine/models.py TelemedicineSessionStatus)
export const TELEMEDICINE_SESSION_STATUS = {
  SCHEDULED: 'SCHEDULED',
  AWAITING_HOST: 'AWAITING_HOST',
  AWAITING_GUEST: 'AWAITING_GUEST',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

// Inquiry Statuses (from inquiries/models.py InquiryStatus)
export const INQUIRY_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  PENDING_PATIENT: 'PENDING_PATIENT',
  ON_HOLD: 'ON_HOLD',
};

// Inquiry Sources (from inquiries/models.py InquirySource)
export const INQUIRY_SOURCE = {
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  WALK_IN: 'WALK_IN',
  WEB_PORTAL: 'WEB_PORTAL',
  CHAT: 'CHAT',
  REFERRAL: 'REFERRAL',
  OTHER: 'OTHER',
};

// Gender options (from patients/models.py Gender)
export const GENDERS = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
    PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
};


// Add other constants as needed, e.g., date formats, pagination defaults, etc.
export const DEFAULT_PAGE_SIZE = 20;
export const DATE_FORMAT_DISPLAY = 'yyyy-MM-dd';
export const DATETIME_FORMAT_DISPLAY = 'yyyy-MM-dd HH:mm';

// API Throttling Scopes (if you want to reference them in frontend logic, though mostly backend enforced)
// export const THROTTLE_SCOPES = {
//   LOGIN: 'login_attempts',
//   REGISTER: 'register_attempts',
//   INQUIRY_CREATE: 'inquiry_creation',
// };
