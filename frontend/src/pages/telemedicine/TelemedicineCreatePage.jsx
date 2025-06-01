import React from "react";
import TelemedicineForm from "../../components/telemedicine/TelemedicineForm";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute"; // General authentication check
// RoleBasedRoute could also be used if more specific roles than just "authenticated" are needed at page level.
// However, TelemedicineForm itself might handle finer-grained role logic for who can schedule for whom.

/**
 * @file TelemedicineCreatePage.jsx
 * @description Page for scheduling a new telemedicine session.
 * This page is accessible to authenticated users who have permission to create sessions
 * (e.g., Patients for themselves, Staff for patients).
 * It uses the PageWithSidebar component for layout and hosts the TelemedicineForm.
 */
const TelemedicineCreatePage = () => {
  // TelemedicineForm handles its own state for creation (no sessionId passed).
  // Permissions for who can create sessions (and for whom) are typically handled
  // within TelemedicineForm or via API restrictions.
  // ProtectedRoute ensures the user is at least logged in.

  return (
    <ProtectedRoute>
      {" "}
      {/* Ensures user is authenticated */}
      <PageWithSidebar title="Schedule New Telemedicine Session">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <p className="text-gray-700 mb-6">
            Fill out the details below to schedule a new telemedicine session.
            Please select the patient and doctor, and confirm the date and time.
          </p>
          <TelemedicineForm /> {/* No sessionId means it's in create mode */}
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default TelemedicineCreatePage;
