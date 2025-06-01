import React, { useState, useContext, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import MedicalRecordsList from "../../components/medical/MedicalRecordsList";
import RecordForm from "../../components/medical/RecordForm"; // Assuming RecordForm is the correct component
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { AuthContext } from "../../context/AuthContext";
import { patientsApi } from "../../api"; // For fetching patient list or specific patient
import usePermissions from "../../hooks/usePermissions";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const MedicalRecordsPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { can, isRole } = usePermissions();
  const location = useLocation();
  const params = useParams(); // Use useParams to get patientUserId from URL if defined like /medical-records/patient/:patientUserId/general

  // Determine patientUserId: from URL params, then location state, then fallback for patient role
  const patientIdFromUrl = params.patientUserId;
  const patientIdFromState = location.state?.patientUserId;
  const patientIdFromQuery = new URLSearchParams(location.search).get(
    "patientUserId"
  );

  const [selectedPatientUserId, setSelectedPatientUserId] = useState(
    patientIdFromUrl ||
      patientIdFromState ||
      patientIdFromQuery ||
      (isRole.isPatient ? currentUser?.id?.toString() : "")
  );

  const [patientName, setPatientName] = useState("");
  const [patients, setPatients] = useState([]);
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [editingMedicalRecord, setEditingMedicalRecord] = useState(null);
  const [error, setError] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    if (isRole.isPatient && currentUser && !selectedPatientUserId) {
      setSelectedPatientUserId(currentUser.id.toString());
    } else if (can("VIEW_PATIENT_LIST") && !isRole.isPatient) {
      setLoadingPatients(true);
      patientsApi
        .listAllPatients()
        .then((data) => {
          const patientList = data?.results || data || [];
          setPatients(patientList);
          if (selectedPatientUserId) {
            const foundPatient = patientList.find(
              (p) => p.user.id.toString() === selectedPatientUserId
            );
            if (foundPatient) {
              setPatientName(
                `${foundPatient.user.first_name} ${foundPatient.user.last_name}`
              );
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch patients for selection:", err);
          setError("Could not load patient list for selection.");
        })
        .finally(() => setLoadingPatients(false));
    } else if (selectedPatientUserId && !patientName && !isRole.isPatient) {
      // If patient ID is set but name isn't, fetch specific patient
      setLoadingPatients(true);
      patientsApi
        .getPatientByUserId(selectedPatientUserId)
        .then((data) => {
          setPatientName(`${data.user.first_name} ${data.user.last_name}`);
        })
        .catch((err) => console.error("Failed to fetch patient name:", err))
        .finally(() => setLoadingPatients(false));
    } else if (
      isRole.isPatient &&
      currentUser &&
      selectedPatientUserId === currentUser.id.toString() &&
      !patientName
    ) {
      setPatientName(`${currentUser.first_name} ${currentUser.last_name}`);
    }
  }, [currentUser, isRole.isPatient, can, selectedPatientUserId, patientName]);

  const handleEditMedicalRecord = (record) => {
    setEditingMedicalRecord(record);
    setShowMedicalRecordForm(true);
  };

  const handleFormSubmitOrCancel = () => {
    setShowMedicalRecordForm(false);
    setEditingMedicalRecord(null);
    // Consider re-fetching records if MedicalRecordsList doesn't auto-update
  };

  const canManageRecords =
    can("CREATE_MEDICAL_RECORD") || can("EDIT_MEDICAL_RECORD");
  const pageTitle =
    selectedPatientUserId && patientName
      ? `Clinical Records: ${patientName} (ID: ${selectedPatientUserId})`
      : isRole.isPatient
      ? "My Clinical Records"
      : "Clinical Records";

  return (
    <ProtectedRoute>
      <PageWithSidebar title={pageTitle}>
        <div className="bg-white p-6 rounded-lg shadow-xl space-y-6">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              {error}
            </div>
          )}

          {!isRole.isPatient && can("VIEW_PATIENT_LIST") && (
            <div className="mb-4">
              <label
                htmlFor="patientSelectForMedicalRecord"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Patient:
              </label>
              {loadingPatients && !patients.length ? (
                <LoadingSpinner size="sm" message="Loading patients..." />
              ) : (
                <select
                  id="patientSelectForMedicalRecord"
                  className="mt-1 block w-full md:w-1/2 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                  value={selectedPatientUserId}
                  onChange={(e) => {
                    const newPatientId = e.target.value;
                    setSelectedPatientUserId(newPatientId);
                    const selectedP = patients.find(
                      (p) => p.user.id.toString() === newPatientId
                    );
                    setPatientName(
                      selectedP
                        ? `${selectedP.user.first_name} ${selectedP.user.last_name}`
                        : ""
                    );
                    setShowMedicalRecordForm(false);
                    setEditingMedicalRecord(null);
                  }}
                >
                  <option value="">-- Select a Patient --</option>
                  {patients.map((p) => (
                    <option key={p.user.id} value={p.user.id}>
                      {p.user.first_name} {p.user.last_name} (ID: {p.user.id})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {selectedPatientUserId ? (
            <>
              {canManageRecords && !showMedicalRecordForm && (
                <div className="flex justify-end mb-4">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 shadow-sm transition"
                    onClick={() => handleEditMedicalRecord(null)}
                  >
                    Add New Clinical Record
                  </button>
                </div>
              )}

              {showMedicalRecordForm ? (
                <RecordForm // Ensure this is the correct form component
                  patientUserId={selectedPatientUserId}
                  existingRecord={editingMedicalRecord} // Pass existingRecord for editing
                  onFormSubmit={handleFormSubmitOrCancel}
                  onCancel={handleFormSubmitOrCancel}
                />
              ) : (
                <MedicalRecordsList
                  patientUserId={selectedPatientUserId}
                  onEditMedicalRecord={
                    canManageRecords ? handleEditMedicalRecord : undefined
                  }
                />
              )}
            </>
          ) : (
            !isRole.isPatient && (
              <p className="text-gray-500">
                Please select a patient to view or manage their clinical
                records.
              </p>
            )
          )}
          {isRole.isPatient && !selectedPatientUserId && (
            <LoadingSpinner message="Loading your clinical records..." />
          )}
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default MedicalRecordsPage;
