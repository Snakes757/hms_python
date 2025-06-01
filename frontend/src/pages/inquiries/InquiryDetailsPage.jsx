import React from "react";
import { useParams } from "react-router-dom";
import InquiryDetails from "../../components/inquiries/InquiryDetails";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";

const InquiryDetailsPage = () => {
  const { inquiryId } = useParams();

  return (
    <ProtectedRoute>
      {" "}
      {}
      <PageWithSidebar title={`Inquiry Details (ID: ${inquiryId})`}>
        <InquiryDetails inquiryIdParam={inquiryId} />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default InquiryDetailsPage;
