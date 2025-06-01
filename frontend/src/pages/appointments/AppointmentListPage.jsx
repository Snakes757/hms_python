import React, { useContext } from "react";
import AppointmentList from "../../components/appointments/AppointmentList";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";

const AppointmentListPage = () => {
  const { user } = useContext(AuthContext);

  const canCreateAppointment =
    user &&
    (user.role === USER_ROLES.ADMIN ||
      user.role === USER_ROLES.RECEPTIONIST ||
      user.role === USER_ROLES.DOCTOR ||
      user.role === USER_ROLES.PATIENT);

  return (
    <ProtectedRoute>
      <PageWithSidebar title="Appointments">
        <div className="mb-6 flex justify-end">
          {canCreateAppointment && (
            <Link
              to="/appointments/new"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium text-sm leading-tight uppercase rounded-md shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block mr-2 -mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Schedule New Appointment
            </Link>
          )}
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl">
          <AppointmentList />
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default AppointmentListPage;
