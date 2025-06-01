import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";
import { appointmentsApi } from "../../api"; // Assuming appointmentsApi is in src/api/index.js for fetching appointments
import LoadingSpinner from "../common/LoadingSpinner";
import { formatDate } from "../../utils/formatters";

/**
 * @file DoctorDashboard.jsx
 * @description Dashboard for Doctors. Provides quick access to schedule, patient search, and summarizes today's activities.
 */

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [upcomingAppointmentsCount, setUpcomingAppointmentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role === USER_ROLES.DOCTOR) {
      const fetchDashboardData = async () => {
        setIsLoading(true);
        setError("");
        try {
          const today = new Date();
          const todayStr = today.toISOString().split("T")[0];

          const params = {
            doctor__id: user.id,
            // Fetch appointments for today and future to minimize data
            appointment_date_time__gte: todayStr,
          };
          const appointmentsData = await appointmentsApi.listAppointments(
            params
          );

          const allFetchedAppointments =
            appointmentsData.results || appointmentsData || [];

          const todayFiltered = allFetchedAppointments.filter((appt) => {
            const apptDate = new Date(appt.appointment_date_time);
            return (
              apptDate.toISOString().split("T")[0] === todayStr &&
              appt.status !== "CANCELLED_BY_PATIENT" &&
              appt.status !== "CANCELLED_BY_STAFF"
            );
          });
          setTodaysAppointments(
            todayFiltered.sort(
              (a, b) =>
                new Date(a.appointment_date_time) -
                new Date(b.appointment_date_time)
            )
          );

          const upcomingFiltered = allFetchedAppointments.filter((appt) => {
            const apptDate = new Date(appt.appointment_date_time);
            return (
              apptDate >= today &&
              (appt.status === "SCHEDULED" || appt.status === "CONFIRMED")
            );
          });
          setUpcomingAppointmentsCount(upcomingFiltered.length);
        } catch (err) {
          console.error("Failed to fetch doctor dashboard data:", err);
          setError("Could not load dashboard data. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchDashboardData();
    } else if (user && user.role !== USER_ROLES.DOCTOR) {
      setError("Access Denied. Doctor role required.");
      setIsLoading(false);
    } else {
      setIsLoading(false); // Not a doctor or no user
    }
  }, [user]);

  if (!user || user.role !== USER_ROLES.DOCTOR) {
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
        <LoadingSpinner message="Loading dashboard data..." />
      </div>
    );
  }

  const quickActions = [
    {
      name: "View Full Schedule",
      link: "/appointments",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "Search Patients",
      link: "/patients",
      icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a4 4 0 11-8 0 4 4 0 018 0zM21 21l-4.35-4.35",
    },
    {
      name: "Schedule New Appointment",
      link: "/appointments/new",
      icon: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      name: "View Telemedicine Sessions",
      link: "/telemedicine/sessions",
      icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, Dr. {user.first_name} {user.last_name}!
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
        {/* Quick Actions Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.link}
                  className="flex items-center p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-150 ease-in-out group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-3 flex-shrink-0"
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
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">
              At a Glance
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Upcoming Appointments:</span>
                <span className="font-semibold text-blue-600">
                  {upcomingAppointmentsCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Appointments Today:</span>
                <span className="font-semibold text-green-600">
                  {todaysAppointments.length}
                </span>
              </div>
              {/* Placeholder for other stats */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unread Messages:</span>
                <span className="font-semibold text-red-600">0</span>{" "}
                {/* Placeholder */}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Appointments Column */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Today's Appointments (
              {formatDate(new Date().toISOString(), {
                month: "long",
                day: "numeric",
                year: "numeric",
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
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {appt.status_display || appt.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
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
                No appointments scheduled for today.
              </p> // [cite: 1251]
            )}
          </div>
        </div>
      </div>

      {/* Placeholder for Recent Patient Interactions */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Recent Patient Interactions
        </h2>
        <p className="text-gray-500 italic">
          (This section will display recent patient records accessed or updated,
          new messages, etc. - Implementation pending specific API endpoints for
          this data.) {/* [cite: 1253] */}
        </p>
        {/* Example: Link to patient search or messages if available */}
        <Link
          to="/patients"
          className="mt-2 inline-block text-sm text-blue-500 hover:text-blue-700 hover:underline font-medium"
        >
          Search Patients &rarr;
        </Link>
      </div>
    </div>
  );
};

export default DoctorDashboard;
