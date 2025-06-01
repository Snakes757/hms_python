// src/routes/NurseRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PageWithSidebar from './PageWithSidebar';

// Nurse Specific Pages/Components
import NurseDashboardPage from '../pages/dashboard/NurseDashboardPage';
// Patient related (general routes usually suffice with component-level filtering)
// Medical related (general routes usually suffice)

const ROLES = { NURSE: 'NURSE' };

const NurseRoutes = () => {
  // Nested under a path protected for NURSE role.
  return (
    <Routes>
      <Route path="dashboard" element={<NurseDashboardPage />} /> 
      {/* NurseDashboardPage includes Sidebar */}

      {/* Example: Specific Nurse tasks page */}
      {/* <Route path="tasks" element={<PageWithSidebar title="My Tasks"><NurseTasksComponent /></PageWithSidebar>} /> */}
      
      {/* Example: A page for nurses to quickly log observations or treatments for any patient they are assigned to */}
      {/* This might be covered by /medical/observations or /medical/treatments with appropriate UI for nurses */}
      {/* <Route path="log-vitals" element={<PageWithSidebar title="Log Vitals/Observations"><QuickLogPageForNurse /></PageWithSidebar>} /> */}

      {/* Catch-all for /nurse/*, redirect to nurse dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default NurseRoutes;
