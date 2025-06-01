import React, { useState, useEffect, useContext } from "react";
import { reportsApi } from "../../api";
import PageWithSidebar from "../../routes/PageWithSidebar";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Link } from "react-router-dom";
import { USER_ROLES } from "../../utils/constants";
import { AuthContext } from "../../context/AuthContext";

const ReportsDashboardPage = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user && user.role === USER_ROLES.ADMIN) {
      const fetchReportsList = async () => {
        setIsLoading(true);
        setError("");
        try {
          const data = await reportsApi.listAvailableReports();
          setReports(data || []);
        } catch (err) {
          setError(err.message || "Failed to fetch list of available reports.");
          setReports([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReportsList();
    } else {
      setError("Access Denied. Admin role required.");
      setIsLoading(false);
    }
  }, [user]);

  const reportLinks = {
    "admin_dashboard:report_patient_statistics":
      "/admin/reports/patient-statistics",
    "admin_dashboard:report_appointment": "/admin/reports/appointment-report",
    "admin_dashboard:report_financial": "/admin/reports/financial-report",
    "admin_dashboard:report_staff_activity": "/admin/reports/staff-activity",
  };

  const reportIcons = {
    "admin_dashboard:report_patient_statistics":
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    "admin_dashboard:report_appointment":
      "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    "admin_dashboard:report_financial":
      "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    "admin_dashboard:report_staff_activity":
      "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  };

  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <PageWithSidebar title="System Reports Dashboard">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Available Reports
          </h2>
          <p className="text-gray-600 mb-6">
            Select a report to view detailed statistics and information.
          </p>

          {isLoading && (
            <LoadingSpinner message="Loading available reports..." />
          )}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              {error}
            </div>
          )}

          {!isLoading && !error && reports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((report, index) => (
                <Link
                  key={index}
                  to={reportLinks[report.endpoint] || "#"}
                  className={`block p-6 bg-gray-50 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 ease-in-out ${
                    !reportLinks[report.endpoint]
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={
                            reportIcons[report.endpoint] ||
                            "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          }
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {report.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {report.description}
                  </p>
                  {!reportLinks[report.endpoint] && (
                    <small className="text-red-500 text-xs block">
                      Frontend link not configured.
                    </small>
                  )}
                </Link>
              ))}
            </div>
          )}
          {!isLoading && !error && reports.length === 0 && (
            <div className="text-center py-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                No reports are currently available or configured.
              </p>
            </div>
          )}
        </div>
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default ReportsDashboardPage;
