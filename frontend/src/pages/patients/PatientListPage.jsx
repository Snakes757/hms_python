import React, { useContext } from "react";
import PatientList from "../../components/patients/PatientList";
import PageWithSidebar from "../../routes/PageWithSidebar";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";
import { USER_ROLES } from "../../utils/constants";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const PatientListPage = () => {
  const { user } = useContext(AuthContext);
  const canRegisterPatient =
    user &&
    (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.RECEPTIONIST);

  return (
    <RoleBasedRoute
      allowedRoles={[
        USER_ROLES.ADMIN,
        USER_ROLES.DOCTOR,
        USER_ROLES.NURSE,
        USER_ROLES.RECEPTIONIST,
      ]}
    >
      <PageWithSidebar title="Patient Management">
        {canRegisterPatient && (
          <div className="mb-6 flex justify-end">
            <Link
              to="/receptionist/patient-registration" // Or a generic admin path if preferred
              className="px-6 py-2.5 bg-green-600 text-white font-medium text-sm leading-tight uppercase rounded-md shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg transition duration-150 ease-in-out"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block mr-2 -mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" />
              </svg>
              Register New Patient
            </Link>
          </div>
        )}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl">
          <PatientList />
        </div>
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default PatientListPage;
