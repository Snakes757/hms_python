// src/pages/reports/FinancialReportPage.jsx
import React from 'react';
import FinancialReport from '../../components/reports/FinancialReport';
import Sidebar from '../../components/common/Sidebar';

const FinancialReportPage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <FinancialReport />
      </div>
    </div>
  );
};

export default FinancialReportPage;
