import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppointmentForm from "../../components/appointments/AppointmentForm";
import PageWithSidebar from "../../routes/PageWithSidebar";
import { appointmentsApi } from "../../api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";
import RoleBasedRoute from "../../components/common/RoleBasedRoute";

const AppointmentEditPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  const [appointmentTitle, setAppointmentTitle] = useState(
    `Edit Appointment #${appointmentId}`
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [canEditThis, setCanEditThis] = useState(false);

  useEffect(() => {
    if (!appointmentId) {
      setError("No appointment ID provided.");
      setIsLoading(false);
      return;
    }

    const fetchAppointmentAndCheckPerms = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await appointmentsApi.getAppointmentDetails(appointmentId);

        let hasPermission = false;
        if (
          currentUser.role === USER_ROLES.ADMIN ||
          currentUser.role === USER_ROLES.RECEPTIONIST
        ) {
          hasPermission = true;
        } else if (
          currentUser.role === USER_ROLES.DOCTOR &&
          data.doctor_details?.id === currentUser.id
        ) {
          hasPermission = true;
        }

        if (!hasPermission) {
          setError("You do not have permission to edit this appointment.");
          setCanEditThis(false);
        } else if (
          data.status === "COMPLETED" ||
          data.status === "CANCELLED_BY_PATIENT" ||
          data.status === "CANCELLED_BY_STAFF"
        ) {
          setError(
            `Appointment is ${
              data.status_display || data.status
            } and cannot be edited.`
          );
          setCanEditThis(false);
        } else {
          setAppointmentTitle(
            `Edit Appt for ${data.patient_details?.user?.first_name} with Dr. ${
              data.doctor_details?.last_name
            } on ${new Date(data.appointment_date_time).toLocaleDateString()}`
          );
          setCanEditThis(true);
        }
      } catch (err) {
        setError(
          err.message ||
            `Failed to fetch appointment details for ID ${appointmentId}.`
        );
        console.error("Error fetching appointment for edit:", err);
        setCanEditThis(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchAppointmentAndCheckPerms();
    } else {
      setIsLoading(false); // Should be caught by RoleBasedRoute if no user
    }
  }, [appointmentId, currentUser]);

  const handleFormSuccess = () => {
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
        <button
          onClick={() => navigate("/appointments")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Back to Appointments
        </button>
      </PageWithSidebar>
    );
  }

  if (!canEditThis && !isLoading) {
    return (
      <PageWithSidebar title="Edit Appointment - Error">
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
          role="alert"
        >
          <p className="font-bold">Access Denied or Invalid Action</p>
          <p>
            You may not have permission to edit this appointment, or it's in a
            non-editable state.
          </p>
        </div>
        <button
          onClick={() => navigate("/appointments")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Back to Appointments
        </button>
      </PageWithSidebar>
    );
  }

  return (
    <RoleBasedRoute
      allowedRoles={[
        USER_ROLES.ADMIN,
        USER_ROLES.RECEPTIONIST,
        USER_ROLES.DOCTOR,
      ]}
    >
      <PageWithSidebar title={appointmentTitle}>
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <AppointmentForm
            appointmentId={appointmentId}
            onFormSubmitSuccess={handleFormSuccess} // Ensure AppointmentForm calls this on success
          />
        </div>
      </PageWithSidebar>
    </RoleBasedRoute>
  );
};

export default AppointmentEditPage;
