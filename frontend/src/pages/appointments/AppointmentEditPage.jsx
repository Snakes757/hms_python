import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppointmentForm from "../../components/appointments/AppointmentForm";
import Sidebar from "../../components/common/Sidebar"; // Assuming a Sidebar component for layout
import PageWithSidebar from "../../routes/PageWithSidebar"; // Or a more general layout component
import { appointmentsApi } from "../../api"; // Assuming appointmentsApi.getAppointmentDetails exists
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";

/**
 * @file AppointmentEditPage.jsx
 * @description Page for editing an existing appointment.
 * Fetches appointment details and passes them to AppointmentForm.
 */
const AppointmentEditPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  const [existingAppointmentData, setExistingAppointmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appointmentId) {
      setError("No appointment ID provided.");
      setIsLoading(false);
      return;
    }

    const fetchAppointment = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await appointmentsApi.getAppointmentDetails(appointmentId);

        // Basic permission check: Can the current user edit this specific appointment?
        // Admins and Receptionists can edit any. Doctors can edit their own.
        const canEdit =
          currentUser.role === USER_ROLES.ADMIN ||
          currentUser.role === USER_ROLES.RECEPTIONIST ||
          (currentUser.role === USER_ROLES.DOCTOR &&
            data.doctor_details?.id === currentUser.id);

        if (!canEdit) {
          setError("You do not have permission to edit this appointment.");
          setExistingAppointmentData(null); // Prevent form rendering
        } else {
          setExistingAppointmentData(data);
        }
      } catch (err) {
        setError(
          err.message ||
            `Failed to fetch appointment details for ID ${appointmentId}.`
        );
        console.error("Error fetching appointment for edit:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      // Ensure currentUser is loaded before trying to fetch/check permissions
      fetchAppointment();
    } else {
      setIsLoading(false); // If no current user, stop loading, ProtectedRoute should handle redirect
    }
  }, [appointmentId, currentUser]);

  const handleFormSuccess = () => {
    // After successful update, navigate to the appointment details page or list
    navigate(`/appointments/${appointmentId}`, {
      replace: true,
      state: { message: "Appointment updated successfully!" },
    });
  };

  if (isLoading) {
    return (
      <PageWithSidebar title="Edit Appointment">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner message="Loading appointment details..." />
        </div>
      </PageWithSidebar>
    );
  }

  if (error) {
    return (
      <PageWithSidebar title="Edit Appointment - Error">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </PageWithSidebar>
    );
  }

  if (!existingAppointmentData && !isLoading) {
    return (
      <PageWithSidebar title="Edit Appointment">
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
          role="alert"
        >
          <p className="font-bold">Not Found</p>
          <p>
            Appointment data could not be loaded, or you do not have permission
            to edit it.
          </p>
        </div>
      </PageWithSidebar>
    );
  }

  return (
    <PageWithSidebar title={`Edit Appointment #${appointmentId}`}>
      <div className="bg-white p-6 rounded-lg shadow-xl">
        {existingAppointmentData && (
          <AppointmentForm
            appointmentId={appointmentId} // Pass the ID to indicate edit mode
            // existingAppointmentData is implicitly handled by AppointmentForm's useEffect when appointmentId is present
            onFormSubmitSuccess={handleFormSuccess} // Renamed prop for clarity
          />
        )}
      </div>
    </PageWithSidebar>
  );
};

export default AppointmentEditPage;
