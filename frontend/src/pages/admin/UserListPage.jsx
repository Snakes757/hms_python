import React from "react";
import UserList from "../../components/admin/UserList";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { USER_ROLES } from "../../utils/constants";
import { Link } from "react-router-dom";

const UserListPage = () => {
  return (
    <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
      <PageWithSidebar title="User Management">
        <div className="mb-4 flex justify-end">
          <Link
            to="/admin/users/new"
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition duration-150 ease-in-out shadow-sm"
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
            Create New User
          </Link>
        </div>
        <UserList />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default UserListPage;
