import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext"; // To check user role if needed
import usePermissions from "../../hooks/usePermissions"; // For permission checks

/**
 * @file MedicalRecords.jsx
 * @description A container component for displaying various sections of a patient's medical records.
 * This component might link to more detailed views for specific record types like
 * general records, prescriptions, treatments, and observations.
 */

/**
 * MedicalRecords component.
 * @param {object} props - The component's props.
 * @param {string|number} props.patientUserId - The User ID of the patient whose medical records are being viewed.
 * @returns {React.ReactElement} The MedicalRecords container component.
 */
const MedicalRecords = ({ patientUserId }) => {
  const { user: currentUser } = useContext(AuthContext);
  const { can, isRole } = usePermissions();

  // Determine if the current user can view any medical information for the given patient
  // This logic might need refinement based on specific access rules (e.g., patient viewing own, doctor viewing patient's)
  const canViewMedicalInfo =
    (isRole.isPatient &&
      currentUser &&
      currentUser.id === parseInt(patientUserId)) ||
    can("VIEW_PATIENT_MEDICAL_RECORDS"); // Assuming a general permission for staff

  if (!patientUserId) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
        Patient User ID is required to display medical records.
      </div>
    );
  }

  if (!canViewMedicalInfo) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        You do not have permission to view these medical records.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Medical Records Overview
      </h2>
      <p className="text-gray-600 mb-6">
        Patient User ID: <span className="font-medium">{patientUserId}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Link to General Medical Records (History, Diagnosis, etc.) */}
        <div className="bg-blue-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-blue-700 mb-2">
            Clinical Records
          </h3>
          <p className="text-gray-600 mb-3">
            View diagnoses, symptoms, and treatment plans.
          </p>
          <Link
            to={`/medical-records/patient/${patientUserId}/general`}
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150"
          >
            View Clinical Records
          </Link>
        </div>

        {/* Link to Prescriptions */}
        <div className="bg-green-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            Prescriptions
          </h3>
          <p className="text-gray-600 mb-3">
            Access current and past medication prescriptions.
          </p>
          <Link
            to={`/medical-records/patient/${patientUserId}/prescriptions`}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition duration-150"
          >
            View Prescriptions
          </Link>
        </div>

        {/* Link to Treatments */}
        <div className="bg-yellow-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-yellow-700 mb-2">
            Treatments
          </h3>
          <p className="text-gray-600 mb-3">
            Review administered treatments and procedures.
          </p>
          <Link
            to={`/medical-records/patient/${patientUserId}/treatments`}
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition duration-150"
          >
            View Treatments
          </Link>
        </div>

        {/* Link to Observations */}
        <div className="bg-purple-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-purple-700 mb-2">
            Observations
          </h3>
          <p className="text-gray-600 mb-3">
            Check vital signs and other logged observations.
          </p>
          <Link
            to={`/medical-records/patient/${patientUserId}/observations`}
            className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-md transition duration-150"
          >
            View Observations
          </Link>
        </div>
      </div>

      {/* Placeholder for more integrated views or summaries if needed */}
      {/* For example, you might have a component here that shows a timeline 
        or a summary of recent activities across all record types.
      */}
      <div className="mt-8 border-t pt-6">
        <p className="text-sm text-gray-500">
          This is an overview. Click on specific sections to see detailed
          records. Ensure you have the necessary permissions to access sensitive
          patient information.
        </p>
      </div>
    </div>
  );
};

export default MedicalRecords;
