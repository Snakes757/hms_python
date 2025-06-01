// src/api/index.js
// Central export point for all API module functions.

// Auth related API calls
export * as authApi from './auth';

// User management (typically admin) API calls
export * as usersApi from './users';

// Patient related API calls
export * as patientsApi from './patients';

// Medical Records (general part of patients module in backend)
export * as medicalRecordsApi from './medicalRecords';

// Appointments API calls
export * as appointmentsApi from './appointments';

// Prescriptions (part of medical_management module in backend)
export * as prescriptionsApi from './prescriptions';

// Treatments (part of medical_management module in backend)
export * as treatmentsApi from './treatments';

// Observations (part of medical_management module in backend)
export * as observationsApi from './observations';

// Billing API calls
export * as billingApi from './billing';

// Telemedicine API calls
export * as telemedicineApi from './telemedicine';

// Inquiries API calls
export * as inquiriesApi from './inquiries';

// Reports (Admin Dashboard) API calls
export * as reportsApi from './reports';

// Example usage in a component:
// import { authApi, patientsApi } from '../api';
//
// const handleLogin = async (credentials) => {
//   const user = await authApi.loginUser(credentials);
//   // ...
// };
//
// const fetchPatients = async () => {
//   const patientList = await patientsApi.listAllPatients();
//   // ...
// };
