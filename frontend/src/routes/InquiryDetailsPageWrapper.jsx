import React from "react";
import { useParams } from "react-router-dom";
import PageWithSidebar from "./PageWithSidebar";
import InquiryDetails from "../components/inquiries/InquiryDetails";
import ProtectedRoute from "../components/common/ProtectedRoute";

const InquiryDetailsPageWrapper = () => {
  const { inquiryId } = useParams();

  return (
    <ProtectedRoute>
      <PageWithSidebar title={`Inquiry #${inquiryId} Details`}>
        <InquiryDetails inquiryIdParam={inquiryId} />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default InquiryDetailsPageWrapper;
