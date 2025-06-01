import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";
import { appointmentsApi, patientsApi } from "../../api"; // Assuming API services
import LoadingSpinner from "../common/LoadingSpinner";
import { formatDate } from "../../utils/formatters";

/**
 * @file NurseDashboard.jsx
 * @description Dashboard for Nurses. Provides quick access to patient care tasks, schedule, and alerts.
 */
const NurseDashboard = () => {
  const { user } = useContext(AuthContext);
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [assignedPatientsCount, setAssignedPatientsCount] = useState(0); // Placeholder, needs specific API
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role === USER_ROLES.NURSE) {
      const fetchDashboardData = async () => {
        setIsLoading(true);
        setError("");
        try {
          const today = new Date();
          const todayStr = today.toISOString().split("T")[0];

          // Fetch appointments where the nurse might be involved or needs visibility
          // This might need a more specific API endpoint for "nurse's shift appointments"
          // For now, fetching appointments for today that are not cancelled.
          const appointmentsParams = {
            appointment_date_time__date: todayStr, // Filter by date part of datetime
            // status__in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'], // Active statuses for today
          };
          const appointmentsData = await appointmentsApi.listAppointments(
            appointmentsParams
          );
          const relevantAppointments = (
            appointmentsData.results ||
            appointmentsData ||
            []
          ).filter(
            (appt) =>
              appt.status !== "CANCELLED_BY_PATIENT" &&
              appt.status !== "CANCELLED_BY_STAFF" &&
              appt.status !== "COMPLETED"
          );
          setTodaysAppointments(
            relevantAppointments.sort(
              (a, b) =>
                new Date(a.appointment_date_time) -
                new Date(b.appointment_date_time)
            )
          );

          // Placeholder for assigned patients count - requires specific backend logic/API
          // For example, if nurses are assigned to specific patients or wards.
          // const patientsData = await patientsApi.listAllPatients({ nurse_id: user.id }); // Example
          // setAssignedPatientsCount(patientsData.count || 0);
          setAssignedPatientsCount(0); // Keeping as placeholder
        } catch (err) {
          console.error("Failed to fetch nurse dashboard data:", err);
          setError("Could not load dashboard data. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchDashboardData();
    } else if (user && user.role !== USER_ROLES.NURSE) {
      setError("Access Denied. Nurse role required.");
      setIsLoading(false);
    } else {
      setIsLoading(false); // No user
    }
  }, [user]);

  if (!user || user.role !== USER_ROLES.NURSE) {
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

  const patientCareActions = [
    {
      name: "View Patient List",
      link: "/patients",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      name: "View All Appointments",
      link: "/appointments",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "Log Patient Observation",
      link: "/medical-records/patient/SELECT_PATIENT/observations",
      icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    }, // Needs patient selection flow
    {
      name: "Record Patient Treatment",
      link: "/medical-records/patient/SELECT_PATIENT/treatments",
      icon: "M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm0 5h5M7 13h5m0 0v5m0-5h5M7 13v5m0 0H3",
    }, // Needs patient selection flow
    {
      name: "Manage Inquiries",
      link: "/inquiries",
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Nurse Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome, {user.first_name} {user.last_name}!
        </p>
      </div>

      {error && (
        <div
          className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Care Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Patient Care Actions
            </h2>
            <div className="space-y-3">
              {patientCareActions.map((action) => (
                <Link
                  key={action.name}
                  to={
                    action.link.includes("SELECT_PATIENT")
                      ? "/patients"
                      : action.link
                  } // Redirect to patient list for selection actions
                  title={
                    action.link.includes("SELECT_PATIENT")
                      ? "Select a patient first"
                      : ""
                  }
                  className="flex items-center p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-150 ease-in-out group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={action.icon}
                    />
                  </svg>
                  <span className="text-sm font-medium">{action.name}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
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
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">
              Quick Stats
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  Today's Active Appointments:
                </span>
                <span className="font-semibold text-blue-600">
                  {todaysAppointments.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Assigned Patients:</span>{" "}
                {/* Placeholder */}
                <span className="font-semibold text-green-600">
                  {assignedPatientsCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Shift / Relevant Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Today's Relevant Appointments (
              {formatDate(new Date().toISOString(), {
                month: "long",
                day: "numeric",
              })}
              )
            </h2>
            {todaysAppointments.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {todaysAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 border border-gray-200 rounded-md hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1">
                      <h3 className="text-md font-semibold text-blue-700">
                        {new Date(
                          appt.appointment_date_time
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        - {appt.patient_details?.user?.first_name}{" "}
                        {appt.patient_details?.user?.last_name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          appt.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : appt.status === "SCHEDULED"
                            ? "bg-yellow-100 text-yellow-700"
                            : appt.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {appt.status_display || appt.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Dr. {appt.doctor_details?.last_name} -{" "}
                      {appt.appointment_type_display || appt.appointment_type}
                    </p>
                    <p
                      className="text-sm text-gray-500 truncate mb-2"
                      title={appt.reason}
                    >
                      Reason: {appt.reason || "Not specified"}
                    </p>
                    <Link
                      to={`/appointments/${appt.id}`}
                      className="text-sm text-blue-500 hover:text-blue-700 hover:underline font-medium"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No active appointments relevant to your shift for today.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Important Alerts / Tasks Placeholder */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Important Alerts & Tasks
        </h2>
        <p className="text-gray-500 italic">
          (This section will display critical patient alerts, medication
          reminders, or assigned tasks. Implementation requires specific backend
          APIs for this data.)
        </p>
      </div>
    </div>
  );
};

export default NurseDashboard;
