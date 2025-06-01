// src/pages/billing/InvoiceListPage.jsx
import React from 'react';
import InvoiceList from '../../components/billing/InvoiceList';
import Sidebar from '../../components/common/Sidebar';
import { Link } from 'react-router-dom'; // For "Create New" button

const InvoiceListPage = () => {
  // This page could be for staff viewing all/filtered invoices,
  // or for a patient viewing their own. The InvoiceList component handles logic.
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Invoices</h1>
          {/* TODO: Conditionally show "Create New Invoice" button based on user role (Admin/Receptionist) */}
          <Link to="/billing/invoices/new" className="btn btn-primary">
             Create New Invoice
          </Link>
        </div>
        <InvoiceList />
      </div>
    </div>
  );
};

export default InvoiceListPage;
