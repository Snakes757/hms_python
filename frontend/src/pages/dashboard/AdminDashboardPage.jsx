// src/pages/dashboard/AdminDashboardPage.jsx
import React from 'react';
import AdminDashboard from '../../components/dashboard/AdminDashboard';
import PageWithSidebar from '../../routes/PageWithSidebar'; // Using the HOC for layout

const AdminDashboardPage = () => {
  return (
    <PageWithSidebar title="Administrator Dashboard">
      <AdminDashboard />
    </PageWithSidebar>
  );
};

export default AdminDashboardPage;
