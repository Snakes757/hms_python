import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <div className="text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-32 w-32 mx-auto mb-8 text-sky-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2"
            transform="translate(0 -1)"
          />
        </svg>
        <h1 className="text-6xl font-extrabold text-sky-400 mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-slate-300 text-lg mb-10">
          Oops! The page you are looking for does not exist. It might have been
          moved or deleted.
        </p>
        <Link
          to="/"
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 text-lg"
        >
          Go to Homepage
        </Link>
      </div>
      <p className="mt-12 text-sm text-slate-500">
        If you believe this is an error, please contact support.
      </p>
    </div>
  );
};

export default NotFoundPage;
