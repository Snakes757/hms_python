import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants"; // Ensure USER_ROLES is imported

/**
 * @file AdminDashboard.jsx
 * @description Dashboard for Hospital Administrators. Provides quick access to key administrative functions.
 */
const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user || user.role !== USER_ROLES.ADMIN) {
    return (
      <div className="p-4">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Access Denied: </strong>
          <span className="block sm:inline">
            You do not have permission to view this page.
          </span>
        </div>
      </div>
    );
  }

  const adminFeatures = [
    {
      title: "User Management",
      description:
        "View, add, edit, and manage all user accounts in the system.",
      link: "/admin/users",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      buttonText: "Manage Users",
      buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    {
      title: "System Reports",
      description:
        "Access patient statistics, appointment trends, financial summaries, and staff activity.",
      link: "/admin/reports",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      buttonText: "View Reports",
      buttonClass: "bg-green-500 hover:bg-green-600 text-white",
    },
    {
      title: "Audit Logs",
      description:
        "Review system audit logs for security and tracking. (Opens Django Admin)", // [cite: 1241]
      link: "/admin/audit_log/auditlogentry/", // This is a direct link to Django admin as per original [cite: 1242]
      external: true,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-yellow-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      buttonText: "View Audit Logs",
      buttonClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
    },
    {
      title: "Appointment Management",
      description: "Oversee and manage all appointments across the system.",
      link: "/appointments",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      buttonText: "Manage Appointments",
      buttonClass: "bg-purple-500 hover:bg-purple-600 text-white",
    },
    {
      title: "Billing Overview",
      description: "Access and manage billing, invoices, and payment records.",
      link: "/billing/dashboard", // Link to a billing dashboard page
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      buttonText: "Go to Billing",
      buttonClass: "bg-red-500 hover:bg-red-600 text-white",
    },
    {
      title: "System Configuration",
      description:
        "Manage system-wide settings and parameters (Typically via Django Admin).",
      link: "/admin/", // Link to the main Django admin interface
      external: true,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      buttonText: "System Config (Admin)",
      buttonClass: "bg-gray-500 hover:bg-gray-600 text-white",
    },
  ];

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome, Administrator! Manage hospital operations and view system
          reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature) => (
          <div
            key={feature.title}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col"
          >
            <div className="p-6 flex-grow">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0">{feature.icon}</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {feature.title}
                  </h2>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4 min-h-[3em]">
                {feature.description}
              </p>
            </div>
            <div className="p-6 bg-gray-50">
              {feature.external ? (
                <a
                  href={feature.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${feature.buttonClass} transition duration-150`}
                >
                  {feature.buttonText}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              ) : (
                <Link
                  to={feature.link}
                  className={`w-full block text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${feature.buttonClass} transition duration-150`}
                >
                  {feature.buttonText}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
