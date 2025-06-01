// src/pages/billing/InvoiceDetailsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import InvoiceDetails from '../../components/billing/InvoiceDetails';
import Sidebar from '../../components/common/Sidebar';

const InvoiceDetailsPage = () => {
  const { invoiceId } = useParams(); // Get invoiceId from URL

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        {/* The InvoiceDetails component will fetch its own data based on invoiceId */}
        <InvoiceDetails invoiceIdParam={invoiceId} /> 
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;
