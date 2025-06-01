import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import AppointmentStatsWidget from "./Widgets/AppointmentStats";
import PageWithSidebar from "../../routes/PageWithSidebar";

const PatientDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <PageWithSidebar title="Patient Dashboard">
        <div className="p-4 text-center">
          <p className="text-red-500">Please log in to view your dashboard.</p>
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </div>
      </PageWithSidebar>
    );
  }

  const patientQuickLinks = [
    {
      name: "My Appointments",
      path: "/appointments",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "Schedule New Appointment",
      path: "/appointments/new",
      icon: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      name: "My Medical Information",
      path: `/patients/${user.id}`,
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      name: "My Invoices",
      path: "/billing/invoices",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    },
    {
      name: "Telemedicine Sessions",
      path: "/telemedicine/sessions",
      icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    },
    {
      name: "Submit an Inquiry",
      path: "/inquiries/new",
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    },
  ];

  return (
    <PageWithSidebar title={`Welcome, ${user.first_name || user.username}!`}>
      <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
        <p className="text-gray-600 mb-8">
          This is your personal health dashboard. Access your appointments,
          medical records, and more.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <AppointmentStatsWidget />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Quick Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {patientQuickLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="flex items-center p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-150 ease-in-out group shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 mr-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={link.icon}
                    />
                  </svg>
                  <span className="text-sm font-medium">{link.name}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Recent Activity
          </h2>
          <p className="text-gray-500 italic">
            (Placeholder for recent appointments, messages, or record updates)
          </p>
          <ul className="mt-3 space-y-2">
            <li className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
              No recent activity to display.
            </li>
          </ul>
        </div>
      </div>
    </PageWithSidebar>
  );
};

export default PatientDashboard;
