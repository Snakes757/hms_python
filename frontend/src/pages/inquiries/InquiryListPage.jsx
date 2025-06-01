import React, { useContext } from "react";
import InquiryList from "../../components/inquiries/InquiryList";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";

const InquiryListPage = () => {
  const { user } = useContext(AuthContext);

  // All authenticated users can submit an inquiry.
  // Staff roles (Admin, Receptionist, Nurse) can manage inquiries.
  const canSubmitInquiry = user;

  return (
    <ProtectedRoute>
      <PageWithSidebar title="Manage Inquiries">
        <div className="mb-6 flex justify-end">
          {canSubmitInquiry && (
            <Link
              to="/inquiries/new"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium text-sm leading-tight uppercase rounded-md shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block mr-2 -mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Submit New Inquiry
            </Link>
          )}
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl">
          <InquiryList />
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default InquiryListPage;
