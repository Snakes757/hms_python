// src/pages/inquiries/InquiryCreatePage.jsx
import React from 'react';
import InquiryForm from '../../components/inquiries/InquiryForm';
import Sidebar from '../../components/common/Sidebar'; // Optional: Sidebar might not be on public inquiry page
import { AuthContext } from '../../context/AuthContext'; // To check if user is logged in for layout

const InquiryCreatePage = () => {
  const { user: currentUser } = React.useContext(AuthContext);

  // Basic layout: if user is logged in, show sidebar. Otherwise, simpler layout.
  // This page can be accessed publicly.
  if (currentUser) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="container-fluid mt-4 flex-grow-1">
          <h1>Submit an Inquiry</h1>
          <p>Please fill out the form below, and we'll get back to you as soon as possible.</p>
          <InquiryForm /> {/* No inquiryId means it's for creation */}
        </div>
      </div>
    );
  }

  // Layout for public (unauthenticated) users
  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
            <h1>Contact Us / Submit an Inquiry</h1>
            <p>Please fill out the form below, and we'll get back to you as soon as possible.</p>
            <InquiryForm />
            <div className="mt-4 text-center">
                <p>Already have an account or an existing inquiry? <Link to="/login">Login here</Link>.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryCreatePage;
