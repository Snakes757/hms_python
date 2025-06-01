// src/pages/reports/AppointmentReportPage.jsx
import React from 'react';
import AppointmentReport from '../../components/reports/AppointmentReport';
import Sidebar from '../../components/common/Sidebar';

const AppointmentReportPage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        {/* Title is handled within the AppointmentReport component */}
        <AppointmentReport />
      </div>
    </div>
  );
};

export default AppointmentReportPage;
