import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TelemedicineForm from "../../components/telemedicine/TelemedicineForm";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute"; // General auth check
// RoleBasedRoute might be used if stricter page-level role access is needed beyond what TelemedicineForm handles
import { telemedicineApi } from "../../api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";

/**
 * @file TelemedicineEditPage.jsx
 * @description Page for editing an existing telemedicine session.
 * Fetches session details to pass to TelemedicineForm, with permission checks.
 */
const TelemedicineEditPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  // TelemedicineForm fetches its own data when sessionId is provided.
  // This page can pre-fetch for title or high-level permission checks if necessary.
  const [sessionTitleInfo, setSessionTitleInfo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [canEditThisSession, setCanEditThisSession] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided.");
      setIsLoading(false);
      return;
    }
    if (!currentUser) {
      setIsLoading(false); // Wait for currentUser
      return;
    }

    const checkPermissionsAndLoadTitle = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Fetch minimal data for permission check and title
        const sessionData = await telemedicineApi.getTelemedicineSessionDetails(
          sessionId
        );

        let hasPermission = false;
        if (
          currentUser.role === USER_ROLES.ADMIN ||
          currentUser.role === USER_ROLES.RECEPTIONIST
        ) {
          hasPermission = true;
        } else if (
          currentUser.role === USER_ROLES.DOCTOR &&
          sessionData.doctor_details?.id === currentUser.id
        ) {
          hasPermission = true;
        } else if (
          currentUser.role === USER_ROLES.PATIENT &&
          sessionData.patient_details?.user?.id === currentUser.id
        ) {
          // Patients can typically only edit specific fields like feedback,
          // which TelemedicineForm should handle internally based on role.
          // For page access, allow if they are the patient.
          hasPermission = true;
        }

        if (!hasPermission) {
          setError(
            "You do not have permission to edit this telemedicine session."
          );
          setCanEditThisSession(false);
        } else if (
          sessionData.status === "COMPLETED" &&
          currentUser.role !== USER_ROLES.PATIENT &&
          currentUser.role !== USER_ROLES.DOCTOR
        ) {
          // Non-patient/doctor roles (Admin/Receptionist) might be restricted from editing completed sessions for certain fields.
          // Patient can give feedback, Doctor can add notes.
          // This logic can be refined in TelemedicineForm. For now, allow access if basic role matches.
          setSessionTitleInfo(
            `Session for ${sessionData.patient_details?.user?.first_name} with Dr. ${sessionData.doctor_details?.last_name}`
          );
          setCanEditThisSession(true);
        } else {
          setSessionTitleInfo(
            `Session for ${sessionData.patient_details?.user?.first_name} with Dr. ${sessionData.doctor_details?.last_name}`
          );
          setCanEditThisSession(true);
        }
      } catch (err) {
        setError(
          err.message || `Failed to load session data for ID ${sessionId}.`
        );
        console.error("Error in TelemedicineEditPage setup:", err);
        setCanEditThisSession(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkPermissionsAndLoadTitle();
  }, [sessionId, currentUser]);

  const handleFormSuccess = () => {
    navigate(`/telemedicine/sessions/${sessionId}`, {
      replace: true,
      state: { message: "Session updated successfully!" },
    });
  };

  if (isLoading) {
    return (
      <PageWithSidebar title="Edit Telemedicine Session">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner message="Loading session details..." />
        </div>
      </PageWithSidebar>
    );
  }

  if (error) {
    return (
      <PageWithSidebar title="Edit Session - Error">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate("/telemedicine/sessions")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Back to Sessions
        </button>
      </PageWithSidebar>
    );
  }

  if (!canEditThisSession && !isLoading) {
    return (
      <PageWithSidebar title="Edit Telemedicine Session">
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
          role="alert"
        >
          <p className="font-bold">Access Denied</p>
          <p>
            Session data could not be loaded, or you do not have permission to
            edit it.
          </p>
        </div>
        <button
          onClick={() => navigate("/telemedicine/sessions")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Back to Sessions
        </button>
      </PageWithSidebar>
    );
  }

  return (
    <ProtectedRoute>
      {" "}
      {/* Ensures user is authenticated; specific role checks are above and within TelemedicineForm */}
      <PageWithSidebar
        title={`Edit Telemedicine Session ${
          sessionTitleInfo ? `- ${sessionTitleInfo}` : `#${sessionId}`
        }`}
      >
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <p className="text-gray-700 mb-6">
            Modify the details of the telemedicine session below.
            {currentUser?.role === USER_ROLES.PATIENT &&
              " You can update your feedback for completed sessions."}
            {currentUser?.role === USER_ROLES.DOCTOR &&
              " You can update notes, status, or meeting links."}
          </p>
          {/* TelemedicineForm will fetch its own full data using sessionId for editing */}
          <TelemedicineForm
            sessionId={sessionId}
            // onFormSubmitSuccess={handleFormSuccess} // Prop name consistency if needed
          />
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default TelemedicineEditPage;
