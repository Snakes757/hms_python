import React, { useContext } from "react";
import InquiryForm from "../../components/inquiries/InquiryForm";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute"; // For logged-in users
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const InquiryCreatePage = () => {
  const { user: currentUser, token } = useContext(AuthContext);

  // If user is logged in, wrap with PageWithSidebar and ProtectedRoute
  if (token && currentUser) {
    return (
      <ProtectedRoute>
        <PageWithSidebar title="Submit New Inquiry">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-3xl mx-auto">
            <p className="text-gray-700 mb-6 text-sm">
              Please fill out the form below with as much detail as possible. If
              this inquiry is related to a specific patient account you manage
              (for staff) or your own account (for patients), it will be
              automatically linked if you are logged in.
            </p>
            <InquiryForm
              isManaging={currentUser.role !== "PATIENT"} // Staff can manage more fields
            />
          </div>
        </PageWithSidebar>
      </ProtectedRoute>
    );
  }

  // Public view for non-logged-in users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <div className="mb-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-auto text-sky-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4c-1.742 0-3.223-.835-3.772-2M12 12H9m3 3h3m-3-3V6m0 9V6m0 9H3.342M12 21V6m0 15c0-2.485 2.015-4.5 4.5-4.5H21m-9 4.5h3m6-3.062A8.959 8.959 0 0121 12c0-4.97-4.03-9-9-9S3 7.03 3 12a9.042 9.042 0 00.432 2.938"
              />
            </svg>
            <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
              Contact Us / Submit an Inquiry
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              We're here to help. Please fill out the form below, and we'll get
              back to you as soon as possible.
            </p>
          </div>
          <InquiryForm isManaging={false} />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account or want to track your inquiries?{" "}
              <Link
                to="/login"
                className="font-medium text-sky-600 hover:text-sky-500"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryCreatePage;
