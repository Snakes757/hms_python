// src/pages/patients/PatientProfilePage.jsx
import React, { useState, useContext, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom"; // Ensure react-router-dom is installed
import PatientProfile from "../../components/patients/PatientProfile";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import MedicalRecordsList from "../../components/medical/MedicalRecordsList";
import RecordForm from "../../components/medical/RecordForm"; // Assuming this is the general medical record form
import PrescriptionList from "../../components/medical/PrescriptionsList"; // Corrected: Plural to match map
import PrescriptionForm from "../../components/medical/PrescriptionForm";
import TreatmentList from "../../components/medical/TreatmentList";
import TreatmentForm from "../../components/medical/TreatmentForm";
import ObservationList from "../../components/medical/ObservationList";
import ObservationForm from "../../components/medical/ObservationForm";
import { AuthContext } from "../../context/AuthContext";
import usePermissions from "../../hooks/usePermissions";
import { patientsApi } from "../../api"; // Assuming you have this
import LoadingSpinner from "../../components/common/LoadingSpinner";

const PatientProfilePage = () => {
  const { userId } = useParams(); // This is the user_id of the patient
  const { user: currentUser } = useContext(AuthContext);
  const { can, isRole } = usePermissions();
  const location = useLocation();

  const [patientData, setPatientData] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [patientError, setPatientError] = useState("");

  // Determine the active tab from URL state or default to 'profile'
  const [activeTab, setActiveTab] = useState(
    location.state?.defaultTab || "profile"
  );
  const [showForm, setShowForm] = useState({
    medicalRecord: false,
    prescription: false,
    treatment: false,
    observation: false,
  });
  const [editingItem, setEditingItem] = useState(null); // To store item being edited

  useEffect(() => {
    const fetchPatient = async () => {
      if (!userId) {
        setPatientError("Patient User ID is missing.");
        setLoadingPatient(false);
        return;
      }
      setLoadingPatient(true);
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
  }, [userId]);

  const handleEditClick = (type, item = null) => {
    setEditingItem(item);
    setShowForm((prev) => ({
      ...Object.fromEntries(Object.keys(prev).map((k) => [k, false])), // Close other forms
      [type]: true, // Open the specific form
    }));
  };

  const handleFormSuccessOrCancel = (type) => {
    setShowForm((prev) => ({ ...prev, [type]: false }));
    setEditingItem(null);
    // Potentially re-fetch data for the list if an item was added/updated
    // For simplicity, this example doesn't auto-refresh lists here.
    // Consider passing a refresh function to forms or using a state management solution.
  };

  const pageTitle = patientData
    ? `Profile: ${patientData.user.first_name} ${patientData.user.last_name}`
    : "Patient Profile";

  if (loadingPatient) {
    return (
      <PageWithSidebar title="Loading Patient...">
        <LoadingSpinner message="Loading patient details..." />
      </PageWithSidebar>
    );
  }
  if (patientError) {
    return (
      <PageWithSidebar title="Error">
        <div className="text-red-500 p-4">{patientError}</div>
      </PageWithSidebar>
    );
  }
  if (!patientData) {
    return (
      <PageWithSidebar title="Not Found">
        <div className="p-4">Patient not found.</div>
      </PageWithSidebar>
    );
  }

  // Permissions checks
  const canManageMedicalRecords = can("MANAGE_MEDICAL_RECORD"); // Example permission
  const canManagePrescriptions = can("MANAGE_PRESCRIPTION");
  const canManageTreatments = can("MANAGE_TREATMENT");
  const canManageObservations = can("MANAGE_OBSERVATION");

  const tabs = [
    { id: "profile", label: "Patient Details" },
    { id: "medical_records", label: "Clinical Records" },
    { id: "prescriptions", label: "Prescriptions" },
    { id: "treatments", label: "Treatments" },
    { id: "observations", label: "Observations" },
  ];

  return (
    <ProtectedRoute>
      <PageWithSidebar title={pageTitle}>
        <div className="bg-white p-6 rounded-lg shadow-xl space-y-8">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "profile" && (
            <PatientProfile
              patientUserId={userId}
              existingPatientDataFromPage={patientData} // Pass fetched data to avoid re-fetch
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
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600"
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
                  prescriptionId={editingItem?.id} // Pass ID if editing
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
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default PatientProfilePage;
