import React, { useState, useContext, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import PatientProfile from "../../components/patients/PatientProfile"; // This is the Patient Details tab content
// PageWithSidebar is removed from here as it's applied by AppRoutes
import ProtectedRoute from "../../components/common/ProtectedRoute"; // This might be redundant if AppRoutes handles it
import MedicalRecordsList from "../../components/medical/MedicalRecordsList";
import RecordForm from "../../components/medical/RecordForm";
import PrescriptionList from "../../components/medical/PrescriptionsList";
import PrescriptionForm from "../../components/medical/PrescriptionForm";
import TreatmentList from "../../components/medical/TreatmentList";
import TreatmentForm from "../../components/medical/TreatmentForm";
import ObservationList from "../../components/medical/ObservationList";
import ObservationForm from "../../components/medical/ObservationForm";
import { AuthContext } from "../../context/AuthContext";
import usePermissions from "../../hooks/usePermissions";
import { patientsApi } from "../../api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const PatientProfilePage = () => {
  const { userId } = useParams(); // This is the patient's user ID from the URL
  const { user: currentUser } = useContext(AuthContext);
  const { can, isRole } = usePermissions();
  const location = useLocation();

  const [patientData, setPatientData] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [patientError, setPatientError] = useState("");

  const [activeTab, setActiveTab] = useState(
    location.state?.defaultTab || "profile"
  );
  const [showForm, setShowForm] = useState({
    medicalRecord: false,
    prescription: false,
    treatment: false,
    observation: false,
  });
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!userId) {
        setPatientError("Patient User ID is missing from URL.");
        setLoadingPatient(false);
        return;
      }
      // Ensure the user viewing this page is either the patient themselves
      // or a staff member with permission.
      if (
        !currentUser ||
        (currentUser.role === "PATIENT" && currentUser.id.toString() !== userId)
      ) {
        // Further check if staff member has permission
        if (!can("VIEW_PATIENT_PROFILE") && !can("VIEW_PATIENT_MEDICAL_RECORDS")) {
            setPatientError("You do not have permission to view this patient's profile.");
            setLoadingPatient(false);
            return;
        }
      }

      setLoadingPatient(true);
      setPatientError("");
      try {
        const data = await patientsApi.getPatientByUserId(userId);
        setPatientData(data);
      } catch (err) {
        setPatientError(err.message || "Failed to load patient data.");
        console.error("Error fetching patient for profile page:", err);
      } finally {
        setLoadingPatient(false);
      }
    };
    fetchPatient();
  }, [userId, currentUser, can]);

  const handleEditClick = (type, item = null) => {
    setEditingItem(item);
    setShowForm((prev) => ({
      ...Object.fromEntries(Object.keys(prev).map((k) => [k, false])), // Close other forms
      [type]: true, // Open the selected form
    }));
    // Scroll to form or ensure it's visible if needed
  };

  const handleFormSuccessOrCancel = (type) => {
    setShowForm((prev) => ({ ...prev, [type]: false }));
    setEditingItem(null);
    // Optionally, trigger a refresh of the list for the specific type if data was added/updated
    // This might require passing a refresh function to the list components or re-fetching patientData
    // For simplicity, we assume list components might re-fetch on their own or a full page refresh might occur.
  };

  // The PageWithSidebar and its title are handled by AppRoutes.jsx
  // This component should just return its content.

  if (loadingPatient) {
    return <LoadingSpinner message="Loading patient details..." />; // Centered loading
  }
  if (patientError) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{patientError}</p>
      </div>
    );
  }
  if (!patientData) {
    return (
      <div className="p-4 text-center text-gray-600">
        Patient data not found.
      </div>
    );
  }

  const canManageMedicalRecords = can("MANAGE_MEDICAL_RECORD") || can("CREATE_MEDICAL_RECORD");
  const canManagePrescriptions = can("MANAGE_PRESCRIPTION") || can("CREATE_PRESCRIPTION");
  const canManageTreatments = can("MANAGE_TREATMENT") || can("RECORD_TREATMENT");
  const canManageObservations = can("MANAGE_OBSERVATION") || can("LOG_OBSERVATION");

  const tabs = [
    { id: "profile", label: "Patient Details" },
    { id: "medical_records", label: "Clinical Records" },
    { id: "prescriptions", label: "Prescriptions" },
    { id: "treatments", label: "Treatments" },
    { id: "observations", label: "Observations" },
  ];

  // ProtectedRoute is applied at the AppRoutes level, so it's not needed here directly
  // if AppRoutes already secures this page.
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-3 px-2 sm:px-3 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 rounded-t-md`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === "profile" && (
          <PatientProfile
            patientUserId={userId}
            // Pass patientData fetched by this page to avoid re-fetch in PatientProfile component
            // PatientProfile component needs to be adjusted to accept this prop
            existingPatientDataFromPage={patientData}
          />
        )}

        {activeTab === "medical_records" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">
                Clinical Records
              </h3>
              {canManageMedicalRecords && !showForm.medicalRecord && (
                <button
                  onClick={() => handleEditClick("medicalRecord")}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition"
                >
                  Add Record
                </button>
              )}
            </div>
            {showForm.medicalRecord ? (
              <RecordForm
                patientUserId={userId}
                existingRecord={editingItem}
                onFormSubmit={() =>
                  handleFormSuccessOrCancel("medicalRecord")
                }
                onCancel={() => handleFormSuccessOrCancel("medicalRecord")}
              />
            ) : (
              <MedicalRecordsList
                patientUserId={userId}
                onEditMedicalRecord={
                  canManageMedicalRecords
                    ? (record) => handleEditClick("medicalRecord", record)
                    : undefined
                }
              />
            )}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">
                Prescriptions
              </h3>
              {canManagePrescriptions && !showForm.prescription && (
                <button
                  onClick={() => handleEditClick("prescription")}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600"
                >
                  Add Prescription
                </button>
              )}
            </div>
            {showForm.prescription ? (
              <PrescriptionForm
                patientUserId={userId}
                prescriptionId={editingItem?.id}
                onFormSubmit={() => handleFormSuccessOrCancel("prescription")}
                onCancel={() => handleFormSuccessOrCancel("prescription")}
              />
            ) : (
              <PrescriptionList
                patientUserId={userId}
                onEditPrescription={
                  canManagePrescriptions
                    ? (rx) => handleEditClick("prescription", rx)
                    : undefined
                }
              />
            )}
          </div>
        )}

        {activeTab === "treatments" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">
                Treatments
              </h3>
              {canManageTreatments && !showForm.treatment && (
                <button
                  onClick={() => handleEditClick("treatment")}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600"
                >
                  Add Treatment
                </button>
              )}
            </div>
            {showForm.treatment ? (
              <TreatmentForm
                patientUserId={userId}
                treatmentId={editingItem?.id}
                onFormSubmit={() => handleFormSuccessOrCancel("treatment")}
                onCancel={() => handleFormSuccessOrCancel("treatment")}
              />
            ) : (
              <TreatmentList
                patientUserId={userId}
                onEditTreatment={
                  canManageTreatments
                    ? (tx) => handleEditClick("treatment", tx)
                    : undefined
                }
              />
            )}
          </div>
        )}

        {activeTab === "observations" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">
                Observations
              </h3>
              {canManageObservations && !showForm.observation && (
                <button
                  onClick={() => handleEditClick("observation")}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600"
                >
                  Add Observation
                </button>
              )}
            </div>
            {showForm.observation ? (
              <ObservationForm
                patientUserId={userId}
                observationId={editingItem?.id}
                onFormSubmit={() => handleFormSuccessOrCancel("observation")}
                onCancel={() => handleFormSuccessOrCancel("observation")}
              />
            ) : (
              <ObservationList
                patientUserId={userId}
                onEditObservation={
                  canManageObservations
                    ? (obs) => handleEditClick("observation", obs)
                    : undefined
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfilePage;
