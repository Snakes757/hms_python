// src/routes/InquiryDetailsPageWrapper.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import PageWithSidebar from './PageWithSidebar'; // HOC for layout
import InquiryDetails from '../components/inquiries/InquiryDetails'; // The actual details component

const InquiryDetailsPageWrapper = () => {
    const { inquiryId } = useParams();
    
    // This wrapper ensures the InquiryDetails component is rendered within the PageWithSidebar layout
    // and receives the inquiryId from the URL parameters.
    return (
        <PageWithSidebar title="Inquiry Details">
            <InquiryDetails inquiryIdParam={inquiryId} />
        </PageWithSidebar>
    );
};

export default InquiryDetailsPageWrapper;
