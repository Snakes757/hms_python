// src/pages/inquiries/InquiryListPage.jsx
import React from 'react';
import InquiryList from '../../components/inquiries/InquiryList';
import Sidebar from '../../components/common/Sidebar';
import { Link } from 'react-router-dom';

const InquiryListPage = () => {
  // This page is accessible to authenticated users.
  // The InquiryList component will filter based on role.
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Manage Inquiries</h1>
          {/* All users (including patients) can submit new inquiries */}
          <Link to="/inquiries/new" className="btn btn-primary">
            Submit New Inquiry
          </Link>
        </div>
        <InquiryList />
      </div>
    </div>
  );
};

export default InquiryListPage;
