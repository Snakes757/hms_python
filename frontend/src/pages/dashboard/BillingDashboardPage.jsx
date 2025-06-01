// src/pages/dashboard/BillingDashboardPage.jsx
import React from 'react';
import BillingDashboard from '../../components/billing/BillingDashboard'; // Component created in previous batch
import Sidebar from '../../components/common/Sidebar';

const BillingDashboardPage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-0 p-0 flex-grow-1"> {/* Use p-0 if dashboard handles its own padding */}
        <BillingDashboard />
      </div>
    </div>
  );
};

export default BillingDashboardPage;
