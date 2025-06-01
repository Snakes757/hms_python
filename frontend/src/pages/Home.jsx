import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { USER_ROLES } from "../utils/constants";

import AdminDashboardPage from "./dashboard/AdminDashboardPage";
import DoctorDashboardPage from "./dashboard/DoctorDashboardPage";
import NurseDashboardPage from "./dashboard/NurseDashboardPage";
import ReceptionistDashboardPage from "./dashboard/ReceptionistDashboardPage";
import PatientDashboardPage from "./dashboard/PatientDashboardPage";

const HomePage = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 mx-auto mb-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h1 className="text-5xl font-bold mb-4">
            Welcome to the Hospital Management System
          </h1>
          <p className="text-xl mb-8">
            Your health, our priority. Please log in to access your dashboard
            and services.
          </p>
          <div className="space-x-4">
            <Link
              to="/login"
              className="bg-white text-indigo-600 font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-100 transition duration-300"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-indigo-600 transition duration-300"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case USER_ROLES.ADMIN:
      return <AdminDashboardPage />;
    case USER_ROLES.DOCTOR:
      return <DoctorDashboardPage />;
    case USER_ROLES.NURSE:
      return <NurseDashboardPage />;
    case USER_ROLES.RECEPTIONIST:
      return <ReceptionistDashboardPage />;
    case USER_ROLES.PATIENT:
      return <PatientDashboardPage />;
    default:
      return (
        <div className="p-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome, {user.first_name || user.username}!
          </h2>
          <p className="text-gray-600 mt-2">
            Your role is not fully configured for a specific dashboard. Please
            contact support.
          </p>
          <Link
            to="/profile/me"
            className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150"
          >
            View My Profile
          </Link>
        </div>
      );
  }
};

export default HomePage;
