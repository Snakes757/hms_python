import React, { useContext } from "react";
import Sidebar from "../components/common/Sidebar";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

const PageWithSidebar = ({ children, title }) => {
  const { user } = useContext(AuthContext);

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-100"> {/* Use bg-gray-100 or your preferred page background */}
        {user && <Sidebar />} {/* Sidebar component */}
        <main className="flex-1 flex flex-col overflow-hidden"> {/* This outer main can keep overflow-hidden if sidebar behavior requires it */}
          {/* Page Header */}
          {user && (
            <header className="bg-white shadow-md p-4 flex justify-between items-center">
              {title && (
                <h1 className="text-2xl font-semibold text-gray-800">
                  {title}
                </h1>
              )}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Logged in as:{" "}
                  <span className="font-medium">
                    {user.first_name || user.username} (
                    {user.role_display || user.role})
                  </span>
                </span>
                <Link
                  to="/profile/settings"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Settings
                </Link>
              </div>
            </header>
          )}
          {/* Main Content Area - Removed overflow-x-hidden */}
          <div
            className={`flex-1 overflow-y-auto p-6 ${ // Removed overflow-x-hidden from here
              !user ? "flex items-center justify-center" : "" // Centering if no user (e.g. for a public page using this layout)
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default PageWithSidebar;
