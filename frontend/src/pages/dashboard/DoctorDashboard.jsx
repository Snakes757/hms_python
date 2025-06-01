// src/pages/dashboard/DoctorDashboardPage.jsx
import React from 'react';
import DoctorDashboard from '../../components/dashboard/DoctorDashboard';
import Sidebar from '../../components/common/Sidebar';

const DoctorDashboardPage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-0 p-0 flex-grow-1"> {/* Use p-0 if dashboard handles its own padding */}
        {/* No explicit title here, DoctorDashboard component has its own title */}
        <DoctorDashboard />
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
