// src/pages/dashboard/DoctorDashboardPage.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom"; // Ensure react-router-dom is installed
import { AuthContext } from "../../context/AuthContext"; // Assuming context path
import { USER_ROLES } from "../../utils/constants"; // Assuming constants path
import DoctorDashboard from "../../components/dashboard/DoctorDashboard"; // Assuming the actual content is in this component
import PageWithSidebar from "../../routes/PageWithSidebar"; // Assuming PageWithSidebar for layout
import ProtectedRoute from "../../components/common/ProtectedRoute";

const DoctorDashboardPage = () => {
  const { user } = useContext(AuthContext);

  if (!user || user.role !== USER_ROLES.DOCTOR) {
    return (
      <PageWithSidebar title="Access Denied">
        <div className="p-4">
          <p className="text-red-500">
            You do not have permission to view this page.
          </p>
          <Link to="/" className="text-blue-500 hover:underline">
            Go to Homepage
          </Link>
        </div>
      </PageWithSidebar>
    );
  }

  return (
    <ProtectedRoute requiredRole={USER_ROLES.DOCTOR}>
      <PageWithSidebar title="Doctor Dashboard">
        {/* Assuming the actual detailed dashboard content is in a component like DoctorDashboard */}
        <DoctorDashboard />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default DoctorDashboardPage;
