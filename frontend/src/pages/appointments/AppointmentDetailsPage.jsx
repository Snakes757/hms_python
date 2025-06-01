import React from "react";
import { useParams } from "react-router-dom";
import AppointmentDetails from "../../components/appointments/AppointmentDetails";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";

const AppointmentDetailsPage = () => {
  const { appointmentId } = useParams();

  return (
    <ProtectedRoute>
      <PageWithSidebar title={`Appointment Details (ID: ${appointmentId})`}>
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <AppointmentDetails appointmentIdParam={appointmentId} />
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default AppointmentDetailsPage;
