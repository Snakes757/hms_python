// src/routes/DoctorRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute'; // If needed for sub-routes
import PageWithSidebar from './PageWithSidebar'; // Layout component

// Doctor Specific Pages/Components
import DoctorDashboardPage from '../pages/dashboard/DoctorDashboardPage';
// Patient related (already covered in general routes, but could be here if specific views)
// import PatientListPage from '../pages/patients/PatientListPage';
// import PatientProfilePage from '../pages/patients/PatientProfilePage';
// Appointment related
// import AppointmentListPage from '../pages/appointments/AppointmentListPage';
// import AppointmentCreatePage from '../pages/appointments/AppointmentCreatePage';
// import AppointmentDetailsPage from '../pages/appointments/AppointmentDetailsPage';

const ROLES = { DOCTOR: 'DOCTOR' };

const DoctorRoutes = () => {
  // These routes are intended to be nested under a path that's already protected for DOCTOR role
  // e.g., in AppRoutes.jsx: <Route path="/doctor/*" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorRoutes /></ProtectedRoute>} />
  // Or, each route here can have its own ProtectedRoute wrapper if they are top-level.

  return (
    <Routes>
      <Route path="dashboard" element={<DoctorDashboardPage />} /> 
      {/* DoctorDashboardPage includes Sidebar */}

      {/* Specific Doctor Views - many might be shared and access controlled within the component */}
      {/* Example: A dedicated "My Schedule" page if different from general appointment list */}
      {/* <Route path="my-schedule" element={<PageWithSidebar title="My Schedule"><DoctorScheduleComponent /></PageWithSidebar>} /> */}
      
      {/* Example: A page for managing only their assigned telemedicine sessions */}
      {/* <Route path="my-telemedicine" element={<PageWithSidebar title="My Telemedicine Sessions"><DoctorTelemedicineList doctorId={currentUser.id} /></PageWithSidebar>} /> */}

      {/* Most patient, appointment, medical routes are general and filtered by role/ID in components.
          If there are truly doctor-exclusive sections beyond the dashboard, add them here.
          For instance, if /patients for a doctor showed a different UI than for a nurse.
      */}

      {/* Catch-all for /doctor/*, redirect to doctor dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default DoctorRoutes;
