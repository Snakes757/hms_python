// src/pages/dashboard/NurseDashboardPage.jsx
import React from 'react';
import NurseDashboard from '../../components/dashboard/NurseDashboard';
import Sidebar from '../../components/common/Sidebar';

const NurseDashboardPage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-0 p-0 flex-grow-1">
        <NurseDashboard />
      </div>
    </div>
  );
};

export default NurseDashboardPage;
