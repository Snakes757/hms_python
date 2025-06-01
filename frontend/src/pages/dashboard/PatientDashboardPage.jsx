// src/pages/dashboard/PatientDashboardPage.jsx
import React from 'react';
import PatientDashboard from '../../components/dashboard/PatientDashboard';
import Sidebar from '../../components/common/Sidebar';

const PatientDashboardPage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-0 p-0 flex-grow-1">
        <PatientDashboard />
      </div>
    </div>
  );
};

export default PatientDashboardPage;
