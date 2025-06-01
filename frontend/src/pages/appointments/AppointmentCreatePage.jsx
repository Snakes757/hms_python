import React from "react";
import AppointmentForm from "../../components/appointments/AppointmentForm";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { USER_ROLES } from "../../utils/constants"; // Assuming USER_ROLES includes roles that can create appointments

const AppointmentCreatePage = () => {
  return (
    <ProtectedRoute>
      <PageWithSidebar title="Schedule New Appointment">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <p className="text-gray-700 mb-6">
            Please fill in the details below to schedule a new appointment.
            Ensure all information is accurate.
          </p>
          <AppointmentForm />
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default AppointmentCreatePage;
