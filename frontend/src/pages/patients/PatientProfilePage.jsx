import React, { useState, useContext, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import PatientProfile from "../../components/patients/PatientProfile"; // Original child component
import ProtectedRoute from "../../components/common/ProtectedRoute"; // Assuming this is for the page itself, not used directly here
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
import { USER_ROLES } from "../../utils/constants"; // For permission checks

const PatientProfilePage = () => {
  const { userId } = useParams(); // Get userId from URL
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);
  const { can } = usePermissions();
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
    console.log("[PatientProfilePage] useEffect triggered. Deps:", { userId, currentUser, authLoading });

    if (authLoading) {
      console.log("[PatientProfilePage] Auth context is loading. Waiting...");
      setLoadingPatient(true); // Ensure loading spinner shows while auth is resolving
      return;
    }

    const fetchPatient = async () => {
      console.log(`[PatientProfilePage] fetchPatient called. userId: ${userId}. currentUser: ${currentUser ? currentUser.id : 'null'}`);
      
      if (!userId || userId === "undefined") { // Check for string "undefined" as well
        setPatientError("Patient User ID is invalid or missing from URL.");
        setLoadingPatient(false);
        console.log("[PatientProfilePage] Invalid userId. Error set. Loading false.");
        return;
      }

      if (!currentUser) {
        setPatientError("User not authenticated. Please log in.");
        setLoadingPatient(false);
        console.log("[PatientProfilePage] No currentUser. Error set. Loading false.");
        return;
      }
      
      const isSelf = currentUser.role === USER_ROLES.PATIENT && currentUser.id.toString() === userId;
      const hasGeneralViewPermission = can("VIEW_PATIENT_PROFILE") || can("VIEW_PATIENT_MEDICAL_RECORDS");

      if (!isSelf && !hasGeneralViewPermission) {
          console.log("[PatientProfilePage] Permission denied for user:", currentUser.id, "to view patient:", userId);
          setPatientError("You do not have permission to view this patient's profile.");
          setLoadingPatient(false);
          return;
      }

      console.log("[PatientProfilePage] Permissions OK. Setting loadingPatient true, clearing error.");
      setLoadingPatient(true);
      setPatientError(""); 
      try {
        console.log(`[PatientProfilePage] Attempting to fetch patient data for ID: ${userId}`);
        const data = await patientsApi.getPatientByUserId(userId);
        console.log("[PatientProfilePage] Fetched patient data:", data);
        if (data) {
            setPatientData(data);
        } else {
            setPatientError(`Patient data not found for ID: ${userId}. The record may not exist or the API returned no data.`);
            setPatientData(null); 
        }
      } catch (err) {
        console.error("[PatientProfilePage] Error fetching patient data:", err);
        setPatientError(err.message || `Failed to load patient data for ID: ${userId}. Check console for details.`);
      } finally {
        console.log("[PatientProfilePage] Fetch attempt finished. Setting loadingPatient false.");
        setLoadingPatient(false);
      }
    };

    fetchPatient();
  }, [userId, currentUser, authLoading, can]); // Added authLoading and can to dependencies

  // Form handling logic (copied from your provided file, ensure it's correct for your needs)
  const handleEditClick = (type, item = null) => {
    setEditingItem(item);
    setShowForm((prev) => ({
      ...Object.fromEntries(Object.keys(prev).map((k) => [k, false])),
      [type]: true,
    }));
  };

  const handleFormSuccessOrCancel = (type) => {
    setShowForm((prev) => ({ ...prev, [type]: false }));
    setEditingItem(null);
    // Optionally, re-fetch patient data if a sub-record (like medical record) was added/updated
    // This depends on whether adding a sub-record should refresh the main patientData object
    // For now, we assume sub-lists handle their own refresh.
  };

  if (loadingPatient || authLoading) { // Check authLoading as well
    console.log("[PatientProfilePage] Rendering LoadingSpinner. loadingPatient:", loadingPatient, "authLoading:", authLoading);
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner message="Loading patient details..." />
      </div>
    );
  }

  if (patientError) {
    console.log("[PatientProfilePage] Rendering error:", patientError);
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded-md" role="alert">
        <p className="font-bold">Error Loading Patient Profile</p>
        <p>{patientError}</p>
      </div>
    );
  }

  if (!patientData) {
    console.log("[PatientProfilePage] Rendering 'Patient data not found or not loaded.' for ID:", userId);
    return (
      <div className="p-4 text-center text-gray-600">
        Patient data could not be loaded for ID: {userId}. Please ensure the ID is correct and you have permissions.
      </div>
    );
  }
  
  console.log("[PatientProfilePage] Rendering patient profile content for:", patientData?.user?.username);

  // Permissions for managing sub-records (ensure 'can' function is correctly implemented)
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

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Close any open forms when switching tabs
                setShowForm({ medicalRecord: false, prescription: false, treatment: false, observation: false });
                setEditingItem(null);
              }}
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
            existingPatientDataFromPage={patientData} // Pass the fetched patientData
          />
        )}

        {activeTab === "medical_records" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">Clinical Records</h3>
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
                onFormSubmit={() => handleFormSuccessOrCancel("medicalRecord")}
                onCancel={() => handleFormSuccessOrCancel("medicalRecord")}
              />
            ) : (
              <MedicalRecordsList
                patientUserId={userId}
                onEditMedicalRecord={canManageMedicalRecords ? (record) => handleEditClick("medicalRecord", record) : undefined}
              />
            )}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">Prescriptions</h3>
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
                onEditPrescription={canManagePrescriptions ? (rx) => handleEditClick("prescription", rx) : undefined}
              />
            )}
          </div>
        )}

        {activeTab === "treatments" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">Treatments</h3>
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
                onEditTreatment={canManageTreatments ? (tx) => handleEditClick("treatment", tx) : undefined}
              />
            )}
          </div>
        )}

        {activeTab === "observations" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">Observations</h3>
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
                onEditObservation={canManageObservations ? (obs) => handleEditClick("observation", obs) : undefined}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfilePage;
