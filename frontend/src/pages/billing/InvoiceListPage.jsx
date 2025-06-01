import React, { useContext } from "react";
import InvoiceList from "../../components/billing/InvoiceList";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";

const InvoiceListPage = () => {
  const { user } = useContext(AuthContext);

  const canCreateInvoice =
    user &&
    (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.RECEPTIONIST);

  return (
    <ProtectedRoute>
      <PageWithSidebar title="Invoices">
        <div className="mb-6 flex justify-end">
          {canCreateInvoice && (
            <Link
              to="/billing/invoices/new"
              className="px-6 py-2.5 bg-green-600 text-white font-medium text-sm leading-tight uppercase rounded-md shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg transition duration-150 ease-in-out"
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
              Create New Invoice
            </Link>
          )}
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl">
          <InvoiceList />
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default InvoiceListPage;
