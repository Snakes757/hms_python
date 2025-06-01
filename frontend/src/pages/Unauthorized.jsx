import React from "react";
import { Link, useNavigate } from "react-router-dom";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <div className="text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-32 w-32 mx-auto mb-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h1 className="text-6xl font-extrabold text-red-400 mb-4">403</h1>
        <h2 className="text-3xl font-semibold mb-6">Access Denied</h2>
        <p className="text-slate-300 text-lg mb-10">
          Oops! You do not have the necessary permissions to access this page.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition duration-300 text-lg w-full sm:w-auto"
          >
            Go Back
          </button>
          <Link
            to="/"
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition duration-300 text-lg w-full sm:w-auto"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
      <p className="mt-12 text-sm text-slate-500">
        If you believe you should have access, please contact an administrator.
      </p>
    </div>
  );
};

export default UnauthorizedPage;
