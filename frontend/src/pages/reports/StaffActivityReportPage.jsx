// src/pages/reports/StaffActivityReportPage.jsx
import React from 'react';
import StaffActivityReport from '../../components/reports/StaffActivityReport';
import Sidebar from '../../components/common/Sidebar';

const StaffActivityReportPage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        {/* The StaffActivityReport component contains its own title */}
        <StaffActivityReport />
      </div>
    </div>
  );
};

export default StaffActivityReportPage;
