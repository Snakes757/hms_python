import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";
import { appointmentsApi, inquiriesApi } from "../../api"; // API services
import LoadingSpinner from "../common/LoadingSpinner";
import { formatDate } from "../../utils/formatters";

/**
 * @file ReceptionistDashboard.jsx
 * @description Dashboard for Receptionists. Provides quick access to patient registration, appointment scheduling, inquiries, and billing.
 */
const ReceptionistDashboard = () => {
  const { user } = useContext(AuthContext);
  const [todaysAppointmentsCount, setTodaysAppointmentsCount] = useState(0);
  const [openInquiriesCount, setOpenInquiriesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role === USER_ROLES.RECEPTIONIST) {
      const fetchDashboardData = async () => {
        setIsLoading(true);
        setError("");
        try {
          const today = new Date().toISOString().split("T")[0];

          // Fetch today's appointments count (all, as receptionists manage broadly)
          const appointmentsParams = { appointment_date_time__date: today };
          const appointmentsData = await appointmentsApi.listAppointments(
            appointmentsParams
          );
          setTodaysAppointmentsCount(
            appointmentsData.results?.length || appointmentsData?.length || 0
          );

          // Fetch open inquiries count
          const inquiriesParams = { status__in: ["OPEN", "IN_PROGRESS"] }; // Active inquiries
          const inquiriesData = await inquiriesApi.listInquiries(
            inquiriesParams
          );
          setOpenInquiriesCount(
            inquiriesData.results?.length || inquiriesData?.length || 0
          );
        } catch (err) {
          console.error("Failed to fetch receptionist dashboard data:", err);
          setError("Could not load dashboard summary. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchDashboardData();
    } else if (user && user.role !== USER_ROLES.RECEPTIONIST) {
      setError("Access Denied. Receptionist role required.");
      setIsLoading(false);
    } else {
      setIsLoading(false); // No user
    }
  }, [user]);

  if (!user || user.role !== USER_ROLES.RECEPTIONIST) {
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

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[300px]">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  const sections = [
    {
      title: "Patient Management",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      links: [
        { name: "Register New Patient", path: "/register" }, // Main registration page
        { name: "Search & View Patients", path: "/patients" },
      ],
    },
    {
      title: "Appointments",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      links: [
        { name: "Schedule New Appointment", path: "/appointments/new" },
        { name: "View Appointment Calendar/List", path: "/appointments" },
      ],
    },
    {
      title: "Inquiries & Billing",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      links: [
        { name: "Manage Inquiries", path: "/inquiries" },
        { name: "Log New Inquiry", path: "/inquiries/new" },
        { name: "Billing Dashboard", path: "/billing/dashboard" },
        { name: "Create New Invoice", path: "/billing/invoices/new" },
      ],
    },
    {
      title: "Telemedicine",
      icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
      links: [
        { name: "Schedule Telemedicine", path: "/telemedicine/sessions/new" },
        { name: "View Telemedicine Sessions", path: "/telemedicine/sessions" },
      ],
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Receptionist Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome, {user.first_name} {user.last_name}!
        </p>
      </div>

      {error && (
        <div
          className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider">
              Today's Appointments
            </p>
            <p className="text-3xl font-bold">{todaysAppointmentsCount}</p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider">Open Inquiries</p>
            <p className="text-3xl font-bold">{openInquiriesCount}</p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
      </div>

      {/* Action Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-indigo-600 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={section.icon}
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700">
                {section.title}
              </h2>
            </div>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="block text-sm text-indigo-600 hover:text-indigo-800 hover:underline p-2 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    {link.name} &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
