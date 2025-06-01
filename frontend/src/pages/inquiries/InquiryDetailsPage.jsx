// src/pages/inquiries/InquiryDetailsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import InquiryDetails from '../../components/inquiries/InquiryDetails'; // Component from previous batch
import Sidebar from '../../components/common/Sidebar';

const InquiryDetailsPage = () => {
  const { inquiryId } = useParams(); // Get inquiryId from URL

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        {/* The InquiryDetails component fetches its own data based on the inquiryId.
          No need to pass inquiryData directly here, just the ID.
        */}
        <InquiryDetails inquiryIdParam={inquiryId} /> 
      </div>
    </div>
  );
};

export default InquiryDetailsPage;
